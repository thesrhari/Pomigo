// hooks/use-pomodoro-tracker.ts
import { useEffect, useRef } from "react";
import { createClient } from "../supabase/client";
import { ActivityFeedService } from "@/lib/activity-feed-service";
import { useUser } from "@/lib/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { RawSession } from "@/lib/hooks/useAnalyticsData";
import { User } from "@supabase/supabase-js";

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
  user: User,
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
    await activityFeedService.processSessionActivity(user, sessionData);
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
  const { user } = useUser();
  const queryClient = useQueryClient();
  const prevSessionTypeRef = useRef<SessionType>(sessionType);
  const wasRunningRef = useRef(timerRunning);
  const prevTimeLeftRef = useRef(timeLeft);

  useEffect(() => {
    const handleSessionCompletion = async (
      completedSessionType: SessionType
    ) => {
      try {
        if (!user) return; // Check if the user is available

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

        const newSession = await addCompletedSession(
          user,
          user.id,
          completedSessionType,
          sessionDuration,
          currentSubject
        );

        queryClient.setQueryData<RawSession[]>(
          ["analytics-data", user.id],
          (oldData) => {
            // If the cache is empty for some reason, initialize it with the new session
            if (!oldData) return [newSession];
            // Otherwise, add the new session to the beginning of the existing array
            return [newSession, ...oldData];
          }
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

      const wasSkipped = wasBreak && prevTimeLeftRef.current > 1;

      if (!wasSkipped) {
        handleSessionCompletion(previousSession);
      }
    }

    prevSessionTypeRef.current = sessionType;
    wasRunningRef.current = timerRunning;
    prevTimeLeftRef.current = timeLeft;
  }, [
    sessionType,
    timerRunning,
    timeLeft,
    currentSubject,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    user,
    queryClient,
  ]);
}
