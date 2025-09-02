// lib/hooks/useAnalyticsData.ts
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  format,
  getYear,
} from "date-fns";

// 1. Define the shape for our new fun fact
export interface FunFact {
  hour: number;
  isEarlyBird: boolean;
}

// Define the final shape of our processed analytics data
export interface AnalyticsData {
  totalStudyTime: number;
  totalTimePerSubject: { name: string; value: number; color: string }[];
  totalStudySessions: number;
  totalBreakTime: number;
  totalShortBreakTime: number;
  totalLongBreakTime: number;
  totalBreakSessions: number;
  currentStreak: number;
  bestStreak: number;
  contributionData: { date: string; count: number }[];
  totalContributionTimeForYear: number;
  funFact: FunFact | null; // 2. Add fun fact to the main interface
}

// Define the type for our filter
export type TimeFilter = "today" | "week" | "month" | "all-time";

// Define the shape of a raw session fetched from Supabase
interface RawSession {
  session_type: "study" | "short_break" | "long_break";
  duration: number;
  subject: string | null;
  started_at: string;
}

interface ProcessedDataAccumulator {
  totalStudyTime: number;
  totalStudySessions: number;
  totalBreakTime: number;
  totalShortBreakTime: number;
  totalLongBreakTime: number;
  totalBreakSessions: number;
  timePerSubject: { [key: string]: number };
}

const supabase = createClient();

const PIE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function useAnalyticsData(filter: TimeFilter, contributionYear: number) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated.");

        if (availableYears.length === 0) {
          const { data: firstSession } = await supabase
            .from("sessions")
            .select("started_at")
            .eq("user_id", user.id)
            .order("started_at", { ascending: true })
            .limit(1)
            .single();

          const firstYear = firstSession
            ? getYear(new Date(firstSession.started_at))
            : new Date().getFullYear();
          const currentYear = new Date().getFullYear();
          const years = Array.from(
            { length: currentYear - firstYear + 1 },
            (_, i) => currentYear - i
          );
          setAvailableYears(years);
        }

        let startDate: Date | null = null;
        switch (filter) {
          case "today":
            startDate = startOfDay(new Date());
            break;
          case "week":
            startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
            break;
          case "month":
            startDate = startOfMonth(new Date());
            break;
          default:
            startDate = null;
        }

        let query = supabase
          .from("sessions")
          .select("session_type, duration, subject, started_at")
          .eq("user_id", user.id);

        if (startDate) {
          query = query.gte("started_at", startDate.toISOString());
        }

        const { data: sessions, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        if (!sessions) throw new Error("No session data returned.");

        const initialAccumulator: ProcessedDataAccumulator = {
          totalStudyTime: 0,
          totalStudySessions: 0,
          totalBreakTime: 0,
          totalShortBreakTime: 0,
          totalLongBreakTime: 0,
          totalBreakSessions: 0,
          timePerSubject: {},
        };

        const processedData = sessions.reduce(
          (acc: ProcessedDataAccumulator, session: RawSession) => {
            if (session.session_type === "study") {
              acc.totalStudyTime += session.duration;
              acc.totalStudySessions += 1;
              const subject = session.subject || "Uncategorized";
              acc.timePerSubject[subject] =
                (acc.timePerSubject[subject] || 0) + session.duration;
            } else {
              acc.totalBreakTime += session.duration;
              acc.totalBreakSessions += 1;
              if (session.session_type === "short_break") {
                acc.totalShortBreakTime += session.duration;
              } else if (session.session_type === "long_break") {
                acc.totalLongBreakTime += session.duration;
              }
            }
            return acc;
          },
          initialAccumulator
        );

        const totalTimePerSubject = Object.entries(processedData.timePerSubject)
          .map(([name, value], index) => ({
            name,
            value,
            color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
          }))
          .sort((a, b) => b.value - a.value);

        const { data: allStudySessions, error: streakError } = await supabase
          .from("sessions")
          .select("started_at")
          .eq("user_id", user.id)
          .eq("session_type", "study");

        if (streakError) throw streakError;

        const { currentStreak, bestStreak } = calculateStreaks(
          allStudySessions || []
        );

        // 3. Calculate the fun fact data
        const funFact = calculateMostActiveHour(allStudySessions || []);

        const yearStartDate = new Date(contributionYear, 0, 1);
        const yearEndDate = new Date(contributionYear, 11, 31, 23, 59, 59);

        const { data: contributionSessions, error: contributionError } =
          await supabase
            .from("sessions")
            .select("started_at, duration")
            .eq("user_id", user.id)
            .eq("session_type", "study")
            .gte("started_at", yearStartDate.toISOString())
            .lte("started_at", yearEndDate.toISOString());

        if (contributionError) throw contributionError;

        const contributionData = generateContributionData(
          contributionSessions || []
        );

        const totalContributionTimeForYear = (
          contributionSessions || []
        ).reduce((sum, session) => sum + session.duration, 0);

        setData({
          ...processedData,
          totalTimePerSubject,
          currentStreak,
          bestStreak,
          contributionData,
          totalContributionTimeForYear,
          funFact, // 4. Add the fun fact to the final data object
        });
      } catch (err: any) {
        console.error("Failed to fetch analytics data:", err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [filter, contributionYear]);

  return { data, loading, error, availableYears };
}

// --- HELPER FUNCTIONS ---

// 5. Add the new helper function to calculate the most active hour
function calculateMostActiveHour(
  sessions: { started_at: string }[]
): FunFact | null {
  if (sessions.length < 3) return null;

  const hourCounts: { [key: number]: number } = {};
  sessions.forEach((session) => {
    const hour = new Date(session.started_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  if (Object.keys(hourCounts).length === 0) return null;

  const mostActiveHour = parseInt(
    Object.entries(hourCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
  );

  return {
    hour: mostActiveHour,
    // FIX: Redefine "Early Bird" to include afternoon hours (5 AM to 6 PM)
    isEarlyBird: mostActiveHour >= 5 && mostActiveHour < 18,
  };
}

function calculateStreaks(sessions: { started_at: string }[]): {
  currentStreak: number;
  bestStreak: number;
} {
  if (sessions.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const uniqueDays = [
    ...new Set(sessions.map((s) => s.started_at.split("T")[0])),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDays.length === 0) return { currentStreak: 0, bestStreak: 0 };

  let currentStreak = 0;
  let bestStreak = 0;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

  if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
    currentStreak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const day1 = new Date(uniqueDays[i]);
      const day2 = new Date(uniqueDays[i + 1]);
      const expectedPrevDay = subDays(day1, 1);
      if (
        format(expectedPrevDay, "yyyy-MM-dd") === format(day2, "yyyy-MM-dd")
      ) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  if (uniqueDays.length > 0) {
    let streak = 1;
    bestStreak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const day1 = new Date(uniqueDays[i]);
      const day2 = new Date(uniqueDays[i + 1]);
      const expectedPrevDay = subDays(day1, 1);
      if (
        format(expectedPrevDay, "yyyy-MM-dd") === format(day2, "yyyy-MM-dd")
      ) {
        streak++;
      } else {
        streak = 1;
      }
      if (streak > bestStreak) {
        bestStreak = streak;
      }
    }
  }

  return { currentStreak, bestStreak };
}

function generateContributionData(
  sessions: { started_at: string; duration: number }[]
): { date: string; count: number }[] {
  const contributions: { [key: string]: number } = {};

  sessions.forEach((session) => {
    const date = format(new Date(session.started_at), "yyyy-MM-dd");
    contributions[date] = (contributions[date] || 0) + session.duration;
  });

  return Object.entries(contributions).map(([date, count]) => ({
    date,
    count,
  }));
}
