// hooks/use-pomodoro-tracker.ts (Enhanced version)
import { useEffect, useRef } from "react";
import { createClient } from "../supabase/client";
import { ActivityFeedService } from "@/lib/activity-feed-service";

type SessionType = "study" | "short_break" | "long_break";

interface UsePomodoroTrackerProps {
  timerRunning: boolean;
  timeLeft: number;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  currentSubject?: string;
  sessionType: SessionType;
}

const supabase = createClient();
const activityFeedService = new ActivityFeedService();

async function addCompletedSession(
  userId: string,
  sessionType: SessionType,
  duration: number,
  subject?: string
) {
  const sessionData = {
    user_id: userId,
    session_type: sessionType,
    duration: duration,
    subject: sessionType === "study" ? subject || null : null,
    started_at: new Date().toISOString(),
  };

  // Insert session into database
  const { error } = await supabase.from("sessions").insert([sessionData]);
  if (error) {
    console.error("Error logging session:", error);
    throw error;
  }

  // Process activity feed
  try {
    await activityFeedService.processSessionActivity(sessionData);
  } catch (err) {
    console.error("Error processing activity feed:", err);
    // Don't throw here - we don't want to break session logging if activity feed fails
  }

  return sessionData;
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
  // Ref to track the previous session type.
  const prevSessionTypeRef = useRef<SessionType>(sessionType);
  // Ref to track if the timer was running. This helps prevent logging
  // when the component first loads or on manual resets.
  const wasRunningRef = useRef(timerRunning);

  useEffect(() => {
    const handleSessionCompletion = async (
      completedSessionType: SessionType
    ) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        let sessionDuration: number;
        switch (completedSessionType) {
          case "study":
            sessionDuration = focusDuration;
            break;
          case "short_break":
            sessionDuration = shortBreakDuration;
            break;
          case "long_break":
            sessionDuration = longBreakDuration;
            break;
        }

        console.log(
          `SESSION COMPLETE: Logging ${completedSessionType} of ${sessionDuration} minutes.`
        );

        await addCompletedSession(
          user.id,
          completedSessionType,
          sessionDuration,
          currentSubject
        );
      } catch (err) {
        console.error("❌ PomodoroTracker failed to log session:", err);
      }
    };

    // --- Core Logic ---
    // A session is considered complete if the sessionType has changed
    // since the last render AND the timer was running before this change.
    const sessionTypeChanged = prevSessionTypeRef.current !== sessionType;
    const wasTimerActive = wasRunningRef.current;

    if (sessionTypeChanged && wasTimerActive) {
      // We log the *previous* session type, which is the one that just finished.
      handleSessionCompletion(prevSessionTypeRef.current);
    }

    // Update refs to store the current state for the next render.
    prevSessionTypeRef.current = sessionType;
    wasRunningRef.current = timerRunning;
  }, [
    sessionType, // The primary dependency that triggers the check
    timerRunning,
    currentSubject,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
  ]);
}
