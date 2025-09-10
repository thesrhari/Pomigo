import useSWR, { useSWRConfig } from "swr";
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

// Fetcher functions for SWR
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
  const { mutate } = useSWRConfig();
  const { userId, isLoading: isUserLoading } = useUser();

  const {
    data: subjects,
    error: subjectsError,
    isLoading: subjectsLoading,
  } = useSWR<Subject[]>(userId ? ["subjects", userId] : null, () =>
    fetchSubjects(userId!)
  );

  const {
    data: pomodoroSettings,
    error: pomodoroError,
    isLoading: pomodoroLoading,
  } = useSWR<PomodoroSettings>(
    userId ? ["pomodoro_settings", userId] : null,
    () => fetchPomodoroSettings(userId!)
  );

  const addSubject = async (name: string, color: string) => {
    try {
      if (!userId) throw new Error("User not found");
      const { error } = await supabase
        .from("subjects")
        .insert({ user_id: userId, subject_name: name, color: color });
      if (error) throw error;
      mutate(["subjects", userId]);
    } catch (err) {
      throw err;
    }
  };

  const updateSubjects = async (subject: Subject) => {
    try {
      if (!userId) throw new Error("User not found");

      // Get the original subject name before updating
      const { data: originalSubject, error: fetchError } = await supabase
        .from("subjects")
        .select("subject_name")
        .eq("id", subject.id)
        .single();

      if (fetchError) throw fetchError;

      const oldSubjectName = originalSubject.subject_name;

      // Update the subject
      const { error: updateError } = await supabase
        .from("subjects")
        .update({ subject_name: subject.name, color: subject.color })
        .eq("id", subject.id);
      if (updateError) throw updateError;

      // Update the sessions with the new subject name
      const { error: updateSessionsError } = await supabase
        .from("sessions")
        .update({ subject: subject.name })
        .eq("user_id", userId)
        .eq("subject", oldSubjectName);

      if (updateSessionsError) throw updateSessionsError;

      mutate(["subjects", userId]);
    } catch (err) {
      console.error("Error updating subjects:", err);
      throw err;
    }
  };

  const deleteSubject = async (subjectId: number) => {
    try {
      if (!userId) throw new Error("User not found");

      // Get the name of the subject to be deleted
      const { data: subjectToDelete, error: fetchError } = await supabase
        .from("subjects")
        .select("subject_name")
        .eq("id", subjectId)
        .single();

      if (fetchError) throw fetchError;

      const subjectNameToDelete = subjectToDelete.subject_name;

      // Get the 'Uncategorized' subject id
      const { data: uncategorizedSubject, error: uncategorizedError } =
        await supabase
          .from("subjects")
          .select("subject_name")
          .eq("user_id", userId)
          .eq("subject_name", "Uncategorized")
          .single();

      if (uncategorizedError) throw uncategorizedError;

      // Update sessions related to the deleted subject
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ subject: uncategorizedSubject.subject_name })
        .eq("user_id", userId)
        .eq("subject", subjectNameToDelete);

      if (updateError) throw updateError;

      // Delete the subject
      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);
      if (deleteError) throw deleteError;
      mutate(["subjects", userId]);
    } catch (err) {
      console.error("Error deleting subject:", err);
      throw err;
    }
  };

  const updatePomodoroSettings = async (
    newSettings: PomodoroSettings,
    userId: string
  ) => {
    try {
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
      mutate(["pomodoro_settings", userId]);
    } catch (err) {
      console.error("Error updating pomodoro settings:", err);
      throw err;
    }
  };

  return {
    subjects: subjects || [],
    pomodoroSettings,
    loading: isUserLoading || subjectsLoading || pomodoroLoading,
    error: subjectsError || pomodoroError,
    addSubject,
    updateSubjects,
    deleteSubject,
    updatePomodoroSettings,
  };
}
