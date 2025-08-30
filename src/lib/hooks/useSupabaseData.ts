import { useState, useEffect } from "react";
import { createClient } from "../supabase/client";

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
  iterations: number;
}

// Default settings to prevent null access
const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusTime: 25,
  shortBreak: 5,
  longBreak: 10,
  iterations: 3,
};

// Initialize Supabase client
const supabase = createClient();

export function useSupabaseData() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // Initialize with default settings instead of null
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(
    DEFAULT_POMODORO_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (err) {
      console.error("Error getting user:", err);
      setError("Failed to get user");
      return null;
    }
  }

  // Fetch subjects from Supabase
  const fetchSubjects = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, subject_name, color")
        .eq("user_id", userId);

      if (error) throw error;

      const typedData =
        data?.map((subject: any) => ({
          id: subject.id,
          name: subject.subject_name,
          color: subject.color,
          totalHours: 0,
        })) || [];

      setSubjects(typedData);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError("Failed to fetch subjects");
    }
  };

  // Fetch pomodoro settings from Supabase
  const fetchPomodoroSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("pomodoro_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no settings found, keep default settings
        if (error.code === "PGRST116") {
          console.log("No pomodoro settings found, using defaults");
          return;
        }
        throw error;
      }

      // Map database fields to our interface
      if (data) {
        setPomodoroSettings({
          focusTime: data.focus_duration || DEFAULT_POMODORO_SETTINGS.focusTime,
          shortBreak: data.short_break || DEFAULT_POMODORO_SETTINGS.shortBreak,
          longBreak: data.long_break || DEFAULT_POMODORO_SETTINGS.longBreak,
          iterations:
            data.long_break_interval || DEFAULT_POMODORO_SETTINGS.iterations,
        });
      }
    } catch (err) {
      console.error("Error fetching pomodoro settings:", err);
      setError("Failed to fetch pomodoro settings");
      // Keep default settings on error
    }
  };

  // Update subjects in Supabase
  const updateSubjects = async (subject: Subject) => {
    try {
      // Check if this is a new subject (no existing ID in our state) or an update
      const existingSubject = subjects.find((s) => s.id === subject.id);

      if (existingSubject) {
        // Update existing subject
        const { error } = await supabase
          .from("subjects")
          .update({
            subject_name: subject.name,
            color: subject.color,
          })
          .eq("id", subject.id);

        if (error) throw error;

        // Update local state
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subject.id
              ? { ...s, name: subject.name, color: subject.color }
              : s
          )
        );
      } else {
        // Add new subject to local state (it was already inserted in the component)
        setSubjects((prev) => [...prev, subject]);
      }
    } catch (err) {
      console.error("Error updating subjects:", err);
      setError("Failed to update subject");
      throw err; // Re-throw so component can handle the error
    }
  };

  // Delete subject from Supabase
  const deleteSubject = async (subjectId: number) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (error) throw error;

      // Update local state
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    } catch (err) {
      console.error("Error deleting subject:", err);
      setError("Failed to delete subject");
      throw err;
    }
  };

  // Update pomodoro settings in Supabase
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
        long_break_interval: newSettings.iterations,
      });

      if (error) throw error;

      // Update local state
      setPomodoroSettings(newSettings);
    } catch (err) {
      console.error("Error updating pomodoro settings:", err);
      setError("Failed to update pomodoro settings");
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = await getUser();
        if (!user) {
          setError("No authenticated user found");
          return;
        }

        await Promise.all([
          fetchSubjects(user.id),
          fetchPomodoroSettings(user.id),
        ]);
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    subjects,
    pomodoroSettings,
    loading,
    error,
    updateSubjects,
    deleteSubject,
    updatePomodoroSettings,
  };
}
