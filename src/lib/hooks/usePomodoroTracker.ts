import { useEffect, useRef } from "react";
import { createClient } from "../supabase/client";

type SessionType = "focus" | "shortBreak" | "longBreak";

interface UsePomodoroTrackerProps {
  timerRunning: boolean;
  timeLeft: number;
  focusDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  currentSubject?: string;
  sessionType: SessionType;
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
          total_break_time: 0,
          total_short_break_time: 0,
          total_long_break_time: 0,
          total_break_sessions: 0,
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

// Update user stats for study time
async function updateUserStudyStats(
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

// Update user stats for break time
async function updateUserBreakStats(
  userId: string,
  breakTimeIncrement: number,
  breakType: "short" | "long",
  sessionIncrement: number = 0
) {
  const stats = await getOrCreateUserStats(userId);

  const updateData: any = {
    total_break_time: stats.total_break_time + breakTimeIncrement,
    total_break_sessions: stats.total_break_sessions + sessionIncrement,
  };

  if (breakType === "short") {
    updateData.total_short_break_time =
      (stats.total_short_break_time || 0) + breakTimeIncrement;
  } else {
    updateData.total_long_break_time =
      (stats.total_long_break_time || 0) + breakTimeIncrement;
  }

  const { error } = await supabase
    .from("user_stats")
    .update(updateData)
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
  shortBreakDuration,
  longBreakDuration,
  currentSubject,
  sessionType,
}: UsePomodoroTrackerProps) {
  const lastMinuteRecordedRef = useRef<number | null>(null);
  const sessionCompletedRef = useRef<boolean>(false);
  const wasRunningRef = useRef<boolean>(false);
  const currentSessionTypeRef = useRef<SessionType>(sessionType);
  const lastTimeLeftRef = useRef<number>(timeLeft);
  const previousTimeLeftRef = useRef<number>(timeLeft);

  // Reset session completed flag when session type changes or timer resets
  useEffect(() => {
    if (currentSessionTypeRef.current !== sessionType) {
      sessionCompletedRef.current = false;
      lastMinuteRecordedRef.current = null;
      currentSessionTypeRef.current = sessionType;
    }
  }, [sessionType]);

  useEffect(() => {
    // Capture the current ref values BEFORE any updates
    const wasRunning = wasRunningRef.current;
    const previousTimeLeft = previousTimeLeftRef.current;
    const lastTimeLeft = lastTimeLeftRef.current;

    const handleStatsUpdate = async () => {
      try {
        const user = await getUser();
        if (!user) return;

        // Get session duration based on type
        const getSessionDuration = () => {
          switch (sessionType) {
            case "focus":
              return focusDuration || 25;
            case "shortBreak":
              return shortBreakDuration || 5;
            case "longBreak":
              return longBreakDuration || 15;
            default:
              return 25;
          }
        };

        const sessionDuration = getSessionDuration();
        const sessionTotalSeconds = sessionDuration * 60;

        // --- Condition 2: Check session completion FIRST ---
        // Use the captured values from the start of this effect
        console.log("🔍 Session completion check:", {
          wasRunning,
          timerRunning,
          timeLeft,
          previousTimeLeft,
          sessionCompleted: sessionCompletedRef.current,
          sessionType,
        });

        // Detect completion: timer reached 0 from a positive value
        const justReachedZero = timeLeft === 0 && previousTimeLeft > 0;

        // Detect completion: timer was running and now stopped at 0
        const stoppedAtZero = wasRunning && !timerRunning && timeLeft === 0;

        const isSessionComplete =
          (justReachedZero || stoppedAtZero) && !sessionCompletedRef.current;

        if (isSessionComplete) {
          console.log(`🎯 Session completed: ${sessionType}`);

          if (sessionType === "focus" && currentSubject) {
            // Complete focus session (increment completed count)
            await updateUserStudyStats(user.id, 0, 1);
            await updateSubjectStats(user.id, currentSubject, 0, 1);
          } else if (
            sessionType === "shortBreak" ||
            sessionType === "longBreak"
          ) {
            const breakType = sessionType === "longBreak" ? "long" : "short";

            // Complete break session (increment completed count)
            await updateUserBreakStats(user.id, 0, breakType, 1);
          }

          sessionCompletedRef.current = true;
          // Don't return here - we might also need to track the final minute
        }

        // --- Condition 1: A new minute has passed while the timer is running ---
        const minutesElapsed = Math.floor(
          (sessionTotalSeconds - timeLeft) / 60
        );
        const lastMinutesElapsed =
          lastMinuteRecordedRef.current !== null
            ? Math.floor(
                (sessionTotalSeconds - lastMinuteRecordedRef.current) / 60
              )
            : -1;

        const isNewMinute =
          timerRunning &&
          minutesElapsed > lastMinutesElapsed &&
          minutesElapsed > 0;

        if (isNewMinute) {
          console.log(
            `📝 New minute tracked: ${minutesElapsed} minutes for ${sessionType}`
          );
          if (sessionType === "focus" && currentSubject) {
            // Track study time
            await updateUserStudyStats(user.id, 1);
            await updateSubjectStats(user.id, currentSubject, 1);
          } else if (
            sessionType === "shortBreak" ||
            sessionType === "longBreak"
          ) {
            // Track break time
            const breakType = sessionType === "longBreak" ? "long" : "short";
            await updateUserBreakStats(user.id, 1, breakType);
          }
          lastMinuteRecordedRef.current = timeLeft;
        }

        // --- Condition 3: The timer has been reset ---
        const isTimerReset =
          timeLeft === sessionTotalSeconds &&
          !timerRunning &&
          previousTimeLeft !== sessionTotalSeconds;

        if (isTimerReset) {
          console.log(`🔄 Timer reset for ${sessionType}`);
          sessionCompletedRef.current = false;
          lastMinuteRecordedRef.current = null;
        }
      } catch (err) {
        console.error("❌ PomodoroTracker error:", err);
      }
    };

    // Get session duration for shouldUpdate check
    const getSessionDuration = () => {
      switch (sessionType) {
        case "focus":
          return focusDuration || 25;
        case "shortBreak":
          return shortBreakDuration || 5;
        case "longBreak":
          return longBreakDuration || 15;
        default:
          return 25;
      }
    };
    const sessionTotalSeconds = getSessionDuration() * 60;

    // Add debugging to see what's happening
    // Log key transitions for debugging
    if (
      timeLeft === 0 ||
      previousTimeLeft === 1 ||
      timerRunning !== wasRunning
    ) {
      console.log("🔍 Debug state:", {
        timeLeft,
        previousTimeLeft,
        timerRunning,
        wasRunning,
        sessionCompleted: sessionCompletedRef.current,
        sessionType,
      });
    }

    const shouldUpdate =
      timerRunning !== wasRunning || // Timer state changed
      (timeLeft === 0 && previousTimeLeft > 0) || // Timer just completed
      (!timerRunning && wasRunning && timeLeft === 0) || // Timer stopped at 0
      (timerRunning && timeLeft % 60 === 0 && timeLeft !== lastTimeLeft) || // New minute while running
      (timeLeft === sessionTotalSeconds &&
        !timerRunning &&
        previousTimeLeft !== timeLeft); // Timer reset

    if (shouldUpdate) {
      console.log("✅ Update triggered:", {
        timerStateChanged: timerRunning !== wasRunning,
        justCompleted: timeLeft === 0 && previousTimeLeft > 0,
        stoppedAtZero: !timerRunning && wasRunning && timeLeft === 0,
        newMinute:
          timerRunning && timeLeft % 60 === 0 && timeLeft !== lastTimeLeft,
        reset:
          timeLeft === sessionTotalSeconds &&
          !timerRunning &&
          previousTimeLeft !== timeLeft,
      });
      handleStatsUpdate();
    }

    // Update refs for next render (do this AFTER handleStatsUpdate)
    previousTimeLeftRef.current = lastTimeLeft;
    wasRunningRef.current = timerRunning;
    lastTimeLeftRef.current = timeLeft;
  }, [
    timeLeft,
    timerRunning,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    currentSubject,
    sessionType,
  ]);

  // Additional effect to handle component unmounting or subject changes
  useEffect(() => {
    return () => {
      // Reset refs when component unmounts or subject changes
      sessionCompletedRef.current = false;
      lastMinuteRecordedRef.current = null;
    };
  }, [currentSubject, sessionType]);
}
