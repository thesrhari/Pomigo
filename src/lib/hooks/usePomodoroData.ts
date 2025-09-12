import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../supabase/client";
import { useUser } from "./useUser";

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
  selectedSoundId: number | null;
}

// Initialize Supabase client
const supabase = createClient();

// Fetcher functions for TanStack Query
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

const fetchPomodoroSettings = async (
  userId: string
): Promise<PomodoroSettings> => {
  const { data, error } = await supabase
    .from("pomodoro_settings")
    .select(
      "focus_duration, short_break, long_break, long_break_enabled, long_break_interval, iterations, sound_enabled, selected_sound_id"
    )
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching pomodoro settings:", error);
    throw error;
  }

  return {
    focusTime: data.focus_duration,
    shortBreak: data.short_break,
    longBreak: data.long_break,
    longBreakEnabled: data.long_break_enabled,
    longBreakInterval: data.long_break_interval,
    iterations: data.iterations,
    soundEnabled: data.sound_enabled,
    selectedSoundId: data.selected_sound_id,
  };
};

export function usePomodoroData() {
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id;

  const {
    data: subjects,
    error: subjectsError,
    isLoading: subjectsLoading,
  } = useQuery<Subject[]>({
    queryKey: ["subjects", userId],
    queryFn: () => fetchSubjects(userId!),
    enabled: !!userId,
  });

  const {
    data: pomodoroSettings,
    error: pomodoroError,
    isLoading: pomodoroLoading,
  } = useQuery<PomodoroSettings>({
    queryKey: ["pomodoro_settings", userId],
    queryFn: () => fetchPomodoroSettings(userId!),
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
      if (!userId) throw new Error("User not found");
      const { error } = await supabase.from("pomodoro_settings").upsert({
        user_id: userId,
        focus_duration: newSettings.focusTime,
        short_break: newSettings.shortBreak,
        long_break: newSettings.longBreak,
        long_break_enabled: newSettings.longBreakEnabled,
        long_break_interval: newSettings.longBreakInterval,
        iterations: newSettings.iterations,
        sound_enabled: newSettings.soundEnabled,
        selected_sound_id: newSettings.selectedSoundId,
      });

      if (error) throw error;
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["pomodoro_settings", userId], newSettings);
    },
  });

  return {
    subjects: subjects || [],
    pomodoroSettings,
    loading: isUserLoading || subjectsLoading || pomodoroLoading,
    error: subjectsError || pomodoroError,
    addSubject: addSubjectMutation.mutateAsync,
    updateSubjects: updateSubjectsMutation.mutateAsync,
    deleteSubject: deleteSubjectMutation.mutateAsync,
    updatePomodoroSettings: updatePomodoroSettingsMutation.mutateAsync,
  };
}
