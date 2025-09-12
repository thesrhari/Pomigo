"use client";

import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";
import { useUser } from "@/lib/hooks/useUser";

const supabase = createClient();

// Fetcher function for weekly chart data, now uses TanStack Query's queryFn context
const weeklyChartFetcher = async ({
  queryKey,
}: {
  queryKey: (string | undefined)[];
}) => {
  const [, userId] = queryKey;
  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const now = new Date();
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("started_at, duration")
    .eq("user_id", userId)
    .eq("session_type", "study")
    .gte("started_at", startOfThisWeek.toISOString())
    .lte("started_at", endOfThisWeek.toISOString());

  if (error) {
    console.error("Error fetching weekly data:", error);
    throw error;
  }

  const daysInWeek = eachDayOfInterval({
    start: startOfThisWeek,
    end: endOfThisWeek,
  });

  const dailyMinutes = new Map<string, number>();
  daysInWeek.forEach((day) => {
    dailyMinutes.set(format(day, "yyyy-MM-dd"), 0);
  });

  sessions.forEach((session) => {
    const dayKey = format(parseISO(session.started_at), "yyyy-MM-dd");
    if (dailyMinutes.has(dayKey)) {
      dailyMinutes.set(dayKey, dailyMinutes.get(dayKey)! + session.duration);
    }
  });

  const chartData = Array.from(dailyMinutes.entries()).map(
    ([date, totalMinutes]) => ({
      day: format(parseISO(date), "E"), // Format to 'Mon', 'Tue', etc.
      hours: parseFloat((totalMinutes / 60).toFixed(1)),
    })
  );

  return chartData;
};

export function useDashboard() {
  const {
    user,
    userId,
    isLoading: isUserLoading,
    error: userError,
  } = useUser();

  const {
    data: weeklyData,
    error: weeklyDataError,
    isLoading: isWeeklyDataLoading,
  } = useQuery({
    queryKey: ["weeklyData", userId],
    queryFn: weeklyChartFetcher,
    enabled: !!userId, // The query will not run until the userId is available. [5, 7, 11]
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData({ type: "today" }, new Date().getFullYear());

  const userName = user?.user_metadata?.full_name || "there";

  const isLoading = isUserLoading || isWeeklyDataLoading || statsLoading;
  const error = userError || weeklyDataError || statsError;

  return {
    userName,
    weeklyData,
    statsData,
    statsLoading: isLoading,
    statsError: error,
  };
}
