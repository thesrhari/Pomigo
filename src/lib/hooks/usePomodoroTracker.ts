// hooks/use-pomodoro-tracker.ts (Corrected and Final Version)
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
  const prevSessionTypeRef = useRef<SessionType>(sessionType);
  const wasRunningRef = useRef(timerRunning);
  // Ref to track the previous timeLeft value to detect skips.
  const prevTimeLeftRef = useRef(timeLeft);

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

    const sessionTypeChanged = prevSessionTypeRef.current !== sessionType;
    const wasTimerActive = wasRunningRef.current;

    if (sessionTypeChanged && wasTimerActive) {
      const previousSession = prevSessionTypeRef.current;
      const wasBreak =
        previousSession === "short_break" || previousSession === "long_break";

      // A break is skipped if its type changes while its timer had more than a second left.
      // We check the ref's value, which holds the timeLeft from the *previous* render.
      const wasSkipped = wasBreak && prevTimeLeftRef.current > 1;

      if (!wasSkipped) {
        handleSessionCompletion(previousSession);
      } else {
        console.log(
          `SESSION SKIPPED: Not logging ${previousSession} as it was skipped by the user.`
        );
      }
    }

    // Update refs to store the current state for the next render.
    prevSessionTypeRef.current = sessionType;
    wasRunningRef.current = timerRunning;
    prevTimeLeftRef.current = timeLeft; // Keep track of the last known time
  }, [
    sessionType,
    timerRunning,
    timeLeft, // Add timeLeft as a dependency to update the ref
    currentSubject,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
  ]);
}
