import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../supabase/client";
import { useUser } from "./useUser";
import { useState, useEffect } from "react";

// Types
interface Subject {
  id: number;
  name: string;
  color: string;
  totalHours: number;
}

interface PomodoroSettings {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakEnabled: boolean;
  longBreakInterval: number;
  iterations: number;
  soundEnabled: boolean;
  selectedSoundId: number;
}

// Initialize Supabase client
const supabase = createClient();

// Default values for Pomodoro settings
const defaultPomodoroSettings: PomodoroSettings = {
  focusTime: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakEnabled: false,
  longBreakInterval: 4,
  iterations: 4,
  soundEnabled: true,
  selectedSoundId: 1,
};

// --- Validation and Local Storage ---

const validateAndSanitize = (settings: any): PomodoroSettings => {
  const sanitizedSettings: PomodoroSettings = { ...defaultPomodoroSettings };

  if (settings) {
    // Validate focusTime
    sanitizedSettings.focusTime =
      typeof settings.focusTime === "number" &&
      settings.focusTime >= 10 &&
      settings.focusTime <= 180
        ? settings.focusTime
        : defaultPomodoroSettings.focusTime;

    // Validate shortBreak
    sanitizedSettings.shortBreak =
      typeof settings.shortBreak === "number" &&
      settings.shortBreak >= 2 &&
      settings.shortBreak <= 90
        ? settings.shortBreak
        : defaultPomodoroSettings.shortBreak;

    // Validate longBreak
    sanitizedSettings.longBreak =
      typeof settings.longBreak === "number" &&
      settings.longBreak >= 10 &&
      settings.longBreak <= 180
        ? settings.longBreak
        : defaultPomodoroSettings.longBreak;

    // Validate longBreakInterval
    sanitizedSettings.longBreakInterval =
      typeof settings.longBreakInterval === "number" &&
      settings.longBreakInterval >= 2 &&
      settings.longBreakInterval <= 10
        ? settings.longBreakInterval
        : defaultPomodoroSettings.longBreakInterval;

    // Validate iterations
    sanitizedSettings.iterations =
      typeof settings.iterations === "number" &&
      settings.iterations >= 1 &&
      settings.iterations <= 10
        ? settings.iterations
        : defaultPomodoroSettings.iterations;

    // Validate selectedSoundId
    sanitizedSettings.selectedSoundId =
      typeof settings.selectedSoundId === "number" &&
      settings.selectedSoundId >= 1 &&
      settings.selectedSoundId <= 5
        ? settings.selectedSoundId
        : defaultPomodoroSettings.selectedSoundId;

    // Assign boolean values
    sanitizedSettings.longBreakEnabled =
      typeof settings.longBreakEnabled === "boolean"
        ? settings.longBreakEnabled
        : defaultPomodoroSettings.longBreakEnabled;
    sanitizedSettings.soundEnabled =
      typeof settings.soundEnabled === "boolean"
        ? settings.soundEnabled
        : defaultPomodoroSettings.soundEnabled;
  }

  return sanitizedSettings;
};

const getPomodoroSettingsFromLocalStorage = (): PomodoroSettings => {
  try {
    const settings = localStorage.getItem("pomodoroSettings");
    if (!settings) {
      localStorage.setItem(
        "pomodoroSettings",
        JSON.stringify(defaultPomodoroSettings)
      );
      return defaultPomodoroSettings;
    }
    const parsedSettings = JSON.parse(settings);
    const validatedSettings = validateAndSanitize(parsedSettings);
    localStorage.setItem("pomodoroSettings", JSON.stringify(validatedSettings));
    return validatedSettings;
  } catch (error) {
    console.error("Failed to parse pomodoro settings from localStorage", error);
    localStorage.setItem(
      "pomodoroSettings",
      JSON.stringify(defaultPomodoroSettings)
    );
    return defaultPomodoroSettings;
  }
};

const savePomodoroSettingsToLocalStorage = (settings: PomodoroSettings) => {
  localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
};

// --- Fetcher functions for TanStack Query ---

const fetchSubjects = async (userId: string): Promise<Subject[]> => {
  // First get all subjects
  const { data: subjectsData, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, subject_name, color")
    .eq("user_id", userId);

  if (subjectsError) throw subjectsError;

  // Then get study session totals for each subject
  const { data: sessionTotals, error: sessionError } = await supabase
    .from("sessions")
    .select("subject, duration")
    .eq("user_id", userId)
    .eq("session_type", "study");

  if (sessionError) throw sessionError;

  // Create a map of subject names to total minutes
  const totalsBySubject =
    sessionTotals?.reduce((acc: Record<string, number>, session) => {
      if (session.subject) {
        acc[session.subject] = (acc[session.subject] || 0) + session.duration;
      }
      return acc;
    }, {}) || {};

  return (
    subjectsData?.map((subject: any) => ({
      id: subject.id,
      name: subject.subject_name,
      color: subject.color,
      totalHours: totalsBySubject[subject.subject_name] || 0, // Total minutes
    })) || []
  );
};

export function usePomodoroData() {
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id;

  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(
    defaultPomodoroSettings
  );

  useEffect(() => {
    setPomodoroSettings(getPomodoroSettingsFromLocalStorage());
  }, []);

  const {
    data: subjects,
    error: subjectsError,
    isLoading: subjectsLoading,
  } = useQuery<Subject[]>({
    queryKey: ["subjects", userId],
    queryFn: () => fetchSubjects(userId!),
    enabled: !!userId,
  });

  const addSubjectMutation = useMutation({
    mutationFn: async (newSubject: { name: string; color: string }) => {
      if (!userId) throw new Error("User not found");
      const { data, error } = await supabase
        .from("subjects")
        .insert({
          user_id: userId,
          subject_name: newSubject.name,
          color: newSubject.color,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newSubjectData) => {
      const newSubject: Subject = {
        id: newSubjectData.id,
        name: newSubjectData.subject_name,
        color: newSubjectData.color,
        totalHours: 0,
      };

      queryClient.setQueryData<Subject[]>(["subjects", userId], (oldData) =>
        oldData ? [...oldData, newSubject] : [newSubject]
      );
    },
  });

  const updateSubjectsMutation = useMutation({
    mutationFn: async (subject: Subject) => {
      if (!userId) throw new Error("User not found");

      const { data: originalSubject, error: fetchError } = await supabase
        .from("subjects")
        .select("subject_name")
        .eq("id", subject.id)
        .single();

      if (fetchError) throw fetchError;
      const oldSubjectName = originalSubject.subject_name;

      const { error: updateError } = await supabase
        .from("subjects")
        .update({ subject_name: subject.name, color: subject.color })
        .eq("id", subject.id);

      if (updateError) throw updateError;

      if (oldSubjectName !== subject.name) {
        const { error: updateSessionsError } = await supabase
          .from("sessions")
          .update({ subject: subject.name })
          .eq("user_id", userId)
          .eq("subject", oldSubjectName);
        if (updateSessionsError) throw updateSessionsError;
      }
      return subject;
    },
    onSuccess: (updatedSubject) => {
      queryClient.setQueryData<Subject[]>(["subjects", userId], (oldData) =>
        oldData
          ? oldData.map((subject) =>
              subject.id === updatedSubject.id ? updatedSubject : subject
            )
          : []
      );
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: number) => {
      if (!userId) throw new Error("User not found");

      const { data: subjectToDelete, error: fetchError } = await supabase
        .from("subjects")
        .select("subject_name")
        .eq("id", subjectId)
        .single();
      if (fetchError) throw fetchError;

      const subjectNameToDelete = subjectToDelete.subject_name;

      const { error: updateError } = await supabase
        .from("sessions")
        .update({ subject: "Uncategorized" })
        .eq("user_id", userId)
        .eq("subject", subjectNameToDelete);
      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);
      if (deleteError) throw deleteError;

      return subjectId;
    },
    onSuccess: (subjectId) => {
      queryClient.setQueryData<Subject[]>(["subjects", userId], (oldData) => {
        if (!oldData) return [];

        const deletedSubject = oldData.find(
          (subject) => subject.id === subjectId
        );
        const uncategorizedSubject = oldData.find(
          (subject) => subject.name === "Uncategorized"
        );

        if (deletedSubject && uncategorizedSubject) {
          uncategorizedSubject.totalHours += deletedSubject.totalHours;
        }

        return oldData.filter((subject) => subject.id !== subjectId);
      });
    },
  });

  const updatePomodoroSettingsMutation = useMutation({
    mutationFn: async (newSettings: PomodoroSettings) => {
      const validatedSettings = validateAndSanitize(newSettings);
      savePomodoroSettingsToLocalStorage(validatedSettings);
      return validatedSettings;
    },
    onSuccess: (newSettings) => {
      setPomodoroSettings(newSettings);
    },
  });

  return {
    subjects: subjects || [],
    pomodoroSettings,
    loading: isUserLoading || subjectsLoading,
    error: subjectsError,
    addSubject: addSubjectMutation.mutateAsync,
    updateSubjects: updateSubjectsMutation.mutateAsync,
    deleteSubject: deleteSubjectMutation.mutateAsync,
    updatePomodoroSettings: updatePomodoroSettingsMutation.mutateAsync,
  };
}
