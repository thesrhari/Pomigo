import { useEffect, useRef } from "react";
import { createClient } from "../supabase/client";

interface UsePomodoroTrackerProps {
  timerRunning: boolean;
  timeLeft: number;
  focusDuration: number;
  currentSubject?: string;
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

  if (error && error.code === "PGRST116") {
    // No record found, create one
    const { data: newData, error: insertError } = await supabase
      .from("user_stats")
      .insert([
        {
          user_id: userId,
          total_study_time: 0,
          total_completed_sessions: 0,
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
  const lastMinuteRecordedRef = useRef<number | null>(null);
  const sessionCompletedRef = useRef<boolean>(false);
  const wasRunningRef = useRef<boolean>(false);

  useEffect(() => {
    const handleStatsUpdate = async () => {
      try {
        // --- Condition 1: A new minute has passed while the timer is running ---
        const isNewMinute =
          timerRunning &&
          timeLeft % 60 === 0 &&
          timeLeft !== focusDuration * 60 &&
          timeLeft > 0 && // Make sure we're not at 0
          lastMinuteRecordedRef.current !== timeLeft;

        if (isNewMinute) {
          const user = await getUser();
          if (!user || !currentSubject) return;

          await updateUserStats(user.id, 1);
          await updateSubjectStats(user.id, currentSubject, 1);
          lastMinuteRecordedRef.current = timeLeft;
          return;
        }

        // --- Condition 2: The timer has just finished (more reliable detection) ---
        const isSessionComplete =
          timeLeft === 0 &&
          wasRunningRef.current && // Timer was running before
          !timerRunning && // Timer is now stopped
          !sessionCompletedRef.current; // Session hasn't been marked complete

        if (isSessionComplete) {
          const user = await getUser();
          console.log(`👤 User:`, user?.id);

          if (!user) {
            console.error("❌ No user found");
            return;
          }

          if (!currentSubject) {
            console.error("❌ No current subject");
            return;
          }

          // Calculate how much study time to add (full session duration)
          const studyTimeToAdd = focusDuration;

          await updateUserStats(user.id, studyTimeToAdd, 1);
          await updateSubjectStats(user.id, currentSubject, studyTimeToAdd, 1);
          sessionCompletedRef.current = true;
          return;
        }

        // --- Condition 3: The timer has been reset ---
        const isTimerReset = timeLeft === focusDuration * 60 && !timerRunning;
        if (isTimerReset) {
          sessionCompletedRef.current = false;
          lastMinuteRecordedRef.current = null;
        }
      } catch (err) {
        console.error("❌ PomodoroTracker error:", err);
      }
    };

    handleStatsUpdate();

    // Update the wasRunning ref for the next render
    wasRunningRef.current = timerRunning;
  }, [timeLeft, timerRunning, focusDuration, currentSubject]);

  // Additional effect to handle component unmounting or subject changes
  useEffect(() => {
    return () => {
      // Reset refs when component unmounts or subject changes
      sessionCompletedRef.current = false;
      lastMinuteRecordedRef.current = null;
    };
  }, [currentSubject]);
}
