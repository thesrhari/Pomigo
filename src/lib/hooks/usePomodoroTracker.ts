import { useEffect, useRef } from "react";
import { createClient } from "../supabase/client";

interface UsePomodoroTrackerProps {
  timerRunning: boolean;
  timeLeft: number;
  focusDuration: number;
  currentSubject?: string; // Add current subject to track per-subject stats
}

const supabase = createClient();

async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Get or create user stats
async function getOrCreateUserStats(userId: string) {
  let { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

// Get or create subject stats
async function getOrCreateSubjectStats(userId: string, subject: string) {
  let { data, error } = await supabase
    .from("subject_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("subject", subject)
    .single();

  if (error && error.code === "PGRST116") {
    // No record found, create one
    const { data: newData, error: insertError } = await supabase
      .from("subject_stats")
      .insert([
        {
          user_id: userId,
          subject: subject,
          study_time: 0,
          completed_sessions: 0,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;
    return newData;
  }

  if (error) throw error;
  return data;
}

// Update user stats
async function updateUserStats(
  userId: string,
  studyTimeIncrement: number,
  sessionIncrement: number = 0
) {
  const stats = await getOrCreateUserStats(userId);

  const { error } = await supabase
    .from("user_stats")
    .update({
      total_study_time: stats.total_study_time + studyTimeIncrement,
      total_completed_sessions:
        stats.total_completed_sessions + sessionIncrement,
    })
    .eq("user_id", userId);

  if (error) throw error;
}

// Update subject stats
async function updateSubjectStats(
  userId: string,
  subject: string,
  studyTimeIncrement: number,
  sessionIncrement: number = 0
) {
  const stats = await getOrCreateSubjectStats(userId, subject);

  const { error } = await supabase
    .from("subject_stats")
    .update({
      study_time: stats.study_time + studyTimeIncrement,
      completed_sessions: stats.completed_sessions + sessionIncrement,
    })
    .eq("user_id", userId)
    .eq("subject", subject);

  if (error) throw error;
}

export function usePomodoroTracker({
  timerRunning,
  timeLeft,
  focusDuration,
  currentSubject,
}: UsePomodoroTrackerProps) {
  // Use a ref to track the last minute that was recorded to prevent duplicate updates.
  const lastMinuteRecordedRef = useRef<number | null>(null);
  const sessionCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    const handleStatsUpdate = async () => {
      try {
        // --- Condition 1: A new minute has passed while the timer is running ---
        const isNewMinute =
          timerRunning &&
          timeLeft % 60 === 0 && // Check if it's the start of a minute
          timeLeft !== focusDuration * 60 && // Not the very beginning of the timer
          lastMinuteRecordedRef.current !== timeLeft; // Ensure this minute hasn't been recorded yet

        if (isNewMinute) {
          // Fetch user and update stats ONLY when a minute has passed.
          const user = await getUser();
          if (!user || !currentSubject) return;

          // Increment both total and subject-specific study time by 1 minute.
          await updateUserStats(user.id, 1);
          await updateSubjectStats(user.id, currentSubject, 1);
          lastMinuteRecordedRef.current = timeLeft; // Mark this minute as recorded.
          return; // Exit after handling to avoid unnecessary checks below.
        }

        // --- Condition 2: The timer has just finished ---
        const isSessionComplete =
          timeLeft === 0 &&
          !timerRunning && // Ensure the timer has actually stopped
          !sessionCompletedRef.current; // And the session hasn't already been marked as complete

        if (isSessionComplete) {
          // Fetch user and update stats ONLY when the session is complete.
          const user = await getUser();
          if (!user || !currentSubject) return;

          // Increment session counts without changing study time.
          await updateUserStats(user.id, 0, 1);
          await updateSubjectStats(user.id, currentSubject, 0, 1);
          sessionCompletedRef.current = true; // Mark session as completed to prevent duplicate updates.
          return;
        }

        // --- Condition 3: The timer has been reset ---
        const isTimerReset = timeLeft === focusDuration * 60;
        if (isTimerReset) {
          // Reset our tracking refs so the next session can be tracked correctly.
          sessionCompletedRef.current = false;
          lastMinuteRecordedRef.current = null;
        }
      } catch (err) {
        console.error("PomodoroTracker error:", err);
      }
    };

    handleStatsUpdate();
  }, [timeLeft, timerRunning, focusDuration, currentSubject]);
}
