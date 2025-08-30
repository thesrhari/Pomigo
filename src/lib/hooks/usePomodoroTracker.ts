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
  const lastTimeRef = useRef<number>(0);
  const sessionCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const user = await getUser();
        if (!user || !currentSubject) return;

        // Track study time every minute
        if (
          timerRunning &&
          timeLeft % 60 === 0 &&
          timeLeft !== focusDuration * 60
        ) {
          // Only increment if a full minute has passed
          if (lastTimeRef.current !== timeLeft) {
            await updateUserStats(user.id, 1); // Increment global study time by 1 minute
            await updateSubjectStats(user.id, currentSubject, 1); // Increment subject study time by 1 minute
            lastTimeRef.current = timeLeft;
          }
        }

        // Track completed session when timer reaches 0
        if (timeLeft === 0 && !sessionCompletedRef.current && !timerRunning) {
          await updateUserStats(user.id, 0, 1); // Increment global sessions
          await updateSubjectStats(user.id, currentSubject, 0, 1); // Increment subject sessions
          sessionCompletedRef.current = true;
        }

        // Reset session completion flag when timer is reset/restarted
        if (timeLeft === focusDuration * 60) {
          sessionCompletedRef.current = false;
        }
      } catch (err) {
        console.error("PomodoroTracker error:", err);
      }
    };

    updateStats();
  }, [timeLeft, timerRunning, focusDuration, currentSubject]);

  // Reset tracking when timer is reset
  useEffect(() => {
    if (timeLeft === focusDuration * 60) {
      lastTimeRef.current = 0;
      sessionCompletedRef.current = false;
    }
  }, [timeLeft, focusDuration]);
}
