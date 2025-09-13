"use client";

import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";
import { useUser } from "@/lib/hooks/useUser";
import { useMemo } from "react";

export function useDashboard() {
  const {
    user,
    userId,
    isLoading: isUserLoading,
    error: userError,
  } = useUser();

  const {
    data: statsData,
    allSessions,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData({ type: "today" }, new Date().getFullYear());

  // Calculate weekly data client-side using useMemo
  const weeklyData = useMemo(() => {
    if (!allSessions) return [];

    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(new Date(), { weekStartsOn: 1 });

    const daysInWeek = eachDayOfInterval({
      start: startOfThisWeek,
      end: endOfThisWeek,
    });

    const dailyMinutes = new Map<string, number>();
    daysInWeek.forEach((day) => {
      dailyMinutes.set(format(day, "yyyy-MM-dd"), 0);
    });

    const thisWeekSessions = allSessions.filter((session) => {
      const sessionDate = parseISO(session.started_at);
      return (
        session.session_type === "study" &&
        sessionDate >= startOfThisWeek &&
        sessionDate <= endOfThisWeek
      );
    });

    thisWeekSessions.forEach((session) => {
      const dayKey = format(parseISO(session.started_at), "yyyy-MM-dd");
      dailyMinutes.set(
        dayKey,
        (dailyMinutes.get(dayKey) || 0) + session.duration
      );
    });

    return Array.from(dailyMinutes.entries()).map(([date, totalMinutes]) => ({
      day: format(parseISO(date), "E"),
      hours: parseFloat((totalMinutes / 60).toFixed(1)),
    }));
  }, [allSessions]);

  const userName = user?.user_metadata?.full_name || "there";
  const isLoading = isUserLoading || statsLoading;
  const error = userError || statsError;

  return {
    userName,
    weeklyData,
    statsData,
    statsLoading: isLoading,
    statsError: error,
  };
}
