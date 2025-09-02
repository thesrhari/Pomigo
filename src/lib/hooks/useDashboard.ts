"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";

export function useDashboard() {
  const supabase = createClient();
  const [userName, setUserName] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<
    { day: string; hours: number }[]
  >([]);

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData("today", new Date().getFullYear());

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.full_name || "there");
    };

    const fetchWeeklyChartData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
      const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });

      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("started_at, duration")
        .eq("user_id", user.id)
        .eq("session_type", "study")
        .gte("started_at", startOfThisWeek.toISOString())
        .lte("started_at", endOfThisWeek.toISOString());

      if (error) {
        console.error("Error fetching weekly data:", error);
        return;
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
          dailyMinutes.set(
            dayKey,
            dailyMinutes.get(dayKey)! + session.duration
          );
        }
      });

      const chartData = Array.from(dailyMinutes.entries()).map(
        ([date, totalMinutes]) => ({
          day: format(parseISO(date), "E"), // Format to 'Mon', 'Tue', etc.
          hours: parseFloat((totalMinutes / 60).toFixed(1)),
        })
      );

      setWeeklyData(chartData);
    };

    fetchUserData();
    fetchWeeklyChartData();
  }, [supabase]);

  return {
    userName,
    weeklyData,
    statsData,
    statsLoading,
    statsError,
  };
}
