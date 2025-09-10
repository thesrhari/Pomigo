"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";

const supabase = createClient();

// Fetcher function to get user data
const userFetcher = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated.");
  }
  return user;
};

// Fetcher function for weekly chart data, dependent on the user ID
const weeklyChartFetcher = async ([, userId]: [string, string]) => {
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
  // Use SWR to fetch the user data
  const { data: user, error: userError } = useSWR("user", userFetcher);

  // Use SWR for weekly data, which depends on the user being available
  const {
    data: weeklyData,
    error: weeklyDataError,
    isLoading: isWeeklyDataLoading,
  } = useSWR(user ? ["weeklyData", user.id] : null, weeklyChartFetcher);

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData({ type: "today" }, new Date().getFullYear());

  const userName = user?.user_metadata?.full_name || "there";

  // Combine loading and error states from all hooks
  const isLoading =
    statsLoading || isWeeklyDataLoading || (!user && !userError);
  const error = statsError || userError || weeklyDataError;

  return {
    userName,
    weeklyData,
    statsData,
    statsLoading: isLoading,
    statsError: error,
  };
}
