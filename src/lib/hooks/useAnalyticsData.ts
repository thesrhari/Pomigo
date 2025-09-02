// lib/hooks/useAnalyticsData.ts
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
  endOfDay,
  endOfWeek,
  endOfMonth,
  format,
  getYear,
  getDay,
  getHours,
} from "date-fns";

const supabase = createClient();

const PIE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// --- TYPE DEFINITIONS ---

export type TimeFilter = "today" | "week" | "month" | "all-time";

interface RawSession {
  session_type: "study" | "short_break" | "long_break";
  duration: number;
  subject: string | null;
  started_at: string;
}

interface FullStudySession {
  duration: number;
  subject: string;
  started_at: string;
}

export interface ProductiveHours {
  start: number;
  end: number;
  isEarlyBird: boolean;
}

export interface FunStatsData {
  powerHour: { hour: number; totalTime: number } | null;
  mostProductiveDay: { day: string; totalTime: number } | null;
  subjectDeepDive: {
    enduranceSubject: { name: string; avgLength: number } | null;
    goToSubject: { name: string; count: number } | null;
  } | null;
}

export interface AnalyticsData {
  // Filterable Data
  totalStudyTime: number;
  totalTimePerSubject: { name: string; value: number; color: string }[];
  totalStudySessions: number;
  totalBreakTime: number;
  totalShortBreakTime: number;
  totalLongBreakTime: number;
  averageSessionLength: number;

  // Comparison Data
  previousPeriodData: {
    totalStudyTime: number;
    totalStudySessions: number;
  } | null;

  // Streak Data (All-Time)
  currentStreak: number;
  bestStreak: number;

  // Contribution Data (Yearly)
  contributionData: { date: string; count: number }[];
  totalContributionTimeForYear: number;

  // Insightful Stats (All-Time)
  productiveHours: ProductiveHours | null;
  funStats: FunStatsData | null;
}

// --- HOOK IMPLEMENTATION ---

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

        // --- 1. Fetch all-time data for streaks, insights, and year list ---
        const { data: allSessions, error: allSessionsError } = await supabase
          .from("sessions")
          .select("session_type, duration, subject, started_at")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false });

        if (allSessionsError) throw allSessionsError;

        const allStudySessions = allSessions
          .filter((s) => s.session_type === "study")
          .map((s) => ({
            ...s,
            subject: s.subject || "Uncategorized",
          })) as FullStudySession[];

        // Set available contribution years on first load
        if (availableYears.length === 0 && allSessions.length > 0) {
          const firstYear = getYear(
            new Date(allSessions[allSessions.length - 1].started_at)
          );
          const currentYear = new Date().getFullYear();
          const years = Array.from(
            { length: currentYear - firstYear + 1 },
            (_, i) => currentYear - i
          );
          setAvailableYears(years);
        }

        // --- 2. Calculate date ranges for current and previous periods ---
        const { currentRange, previousRange } = getDateRanges(filter);

        // --- 3. Filter sessions for the current and previous periods ---
        const currentPeriodSessions = allSessions.filter((s) => {
          const sessionDate = new Date(s.started_at);
          return currentRange.start ? sessionDate >= currentRange.start : true;
        });

        const previousPeriodSessions =
          previousRange.start && previousRange.end
            ? allSessions.filter((s) => {
                const sessionDate = new Date(s.started_at);
                return (
                  sessionDate >= previousRange.start! &&
                  sessionDate <= previousRange.end!
                );
              })
            : [];

        // --- 4. Process data for both periods ---
        const currentData = processSessions(currentPeriodSessions);
        const previousData = processSessions(previousPeriodSessions);

        const totalTimePerSubject = Object.entries(currentData.timePerSubject)
          .map(([name, value], index) => ({
            name,
            value,
            color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
          }))
          .sort((a, b) => b.value - a.value);

        // --- 5. Calculate streaks and insightful stats from all-time data ---
        const { currentStreak, bestStreak } =
          calculateStreaks(allStudySessions);
        const productiveHours = calculateProductiveHours(allStudySessions);
        const funStats = calculateFunStats(allStudySessions);

        // --- 6. Calculate contribution graph data for the selected year ---
        const { contributionData, totalContributionTimeForYear } =
          getContributionDataForYear(allStudySessions, contributionYear);

        setData({
          ...currentData,
          totalTimePerSubject,
          previousPeriodData: {
            totalStudyTime: previousData.totalStudyTime,
            totalStudySessions: previousData.totalStudySessions,
          },
          currentStreak,
          bestStreak,
          productiveHours,
          funStats,
          contributionData,
          totalContributionTimeForYear,
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

// --- HELPER & CALCULATION FUNCTIONS ---

function processSessions(sessions: RawSession[]) {
  const accumulator = {
    totalStudyTime: 0,
    totalStudySessions: 0,
    totalBreakTime: 0,
    totalShortBreakTime: 0,
    totalLongBreakTime: 0,
    timePerSubject: {} as { [key: string]: number },
  };

  sessions.forEach((session) => {
    if (session.session_type === "study") {
      accumulator.totalStudyTime += session.duration;
      accumulator.totalStudySessions += 1;
      const subject = session.subject || "Uncategorized";
      accumulator.timePerSubject[subject] =
        (accumulator.timePerSubject[subject] || 0) + session.duration;
    } else {
      accumulator.totalBreakTime += session.duration;
      if (session.session_type === "short_break")
        accumulator.totalShortBreakTime += session.duration;
      else if (session.session_type === "long_break")
        accumulator.totalLongBreakTime += session.duration;
    }
  });

  const averageSessionLength =
    accumulator.totalStudySessions > 0
      ? accumulator.totalStudyTime / accumulator.totalStudySessions
      : 0;

  return { ...accumulator, averageSessionLength };
}

function getDateRanges(filter: TimeFilter) {
  const now = new Date();
  let currentRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };
  let previousRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };

  switch (filter) {
    case "today":
      currentRange = { start: startOfDay(now), end: now };
      previousRange = {
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
      };
      break;
    case "week":
      currentRange = { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
      previousRange = {
        start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
      };
      break;
    case "month":
      currentRange = { start: startOfMonth(now), end: now };
      previousRange = {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(subMonths(now, 1)),
      };
      break;
    case "all-time":
    default:
      break;
  }
  return { currentRange, previousRange };
}

function calculateStreaks(sessions: { started_at: string }[]) {
  if (sessions.length === 0) return { currentStreak: 0, bestStreak: 0 };
  const uniqueDays = [
    ...new Set(
      sessions.map((s) => format(new Date(s.started_at), "yyyy-MM-dd"))
    ),
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
      if (
        format(subDays(day1, 1), "yyyy-MM-dd") === format(day2, "yyyy-MM-dd")
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
      if (
        format(subDays(day1, 1), "yyyy-MM-dd") === format(day2, "yyyy-MM-dd")
      ) {
        streak++;
      } else {
        streak = 1;
      }
      if (streak > bestStreak) bestStreak = streak;
    }
  }
  return { currentStreak, bestStreak };
}

function getContributionDataForYear(
  sessions: FullStudySession[],
  year: number
) {
  const contributions: { [key: string]: number } = {};
  let totalContributionTimeForYear = 0;

  sessions.forEach((session) => {
    const sessionDate = new Date(session.started_at);
    if (getYear(sessionDate) === year) {
      const date = format(sessionDate, "yyyy-MM-dd");
      contributions[date] = (contributions[date] || 0) + session.duration;
      totalContributionTimeForYear += session.duration;
    }
  });

  const contributionData = Object.entries(contributions).map(
    ([date, count]) => ({ date, count })
  );
  return { contributionData, totalContributionTimeForYear };
}

function calculateProductiveHours(
  sessions: FullStudySession[]
): ProductiveHours | null {
  if (sessions.length < 5) return null;
  const hourCounts: { [key: number]: number } = {};
  sessions.forEach((s) => {
    const hour = getHours(new Date(s.started_at));
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  if (Object.keys(hourCounts).length === 0) return null;

  const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
  const peakHour = parseInt(sortedHours[0][0]);

  // A simple approach: find the peak hour and the next most common one.
  let secondHour =
    sortedHours.length > 1 ? parseInt(sortedHours[1][0]) : peakHour;
  const start = Math.min(peakHour, secondHour);
  const end = Math.max(peakHour, secondHour);

  return {
    start,
    end,
    isEarlyBird: start >= 5 && start < 18,
  };
}

function calculateFunStats(sessions: FullStudySession[]): FunStatsData | null {
  if (sessions.length === 0) return null;

  // 1. Power Hour (hour with most total study time)
  const timePerHour: { [key: number]: number } = {};
  sessions.forEach((s) => {
    const hour = getHours(new Date(s.started_at));
    timePerHour[hour] = (timePerHour[hour] || 0) + s.duration;
  });
  const powerHourEntry = Object.entries(timePerHour).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const powerHour = powerHourEntry
    ? { hour: parseInt(powerHourEntry[0]), totalTime: powerHourEntry[1] }
    : null;

  // 2. Most Productive Day (day with most total study time)
  const timePerDay: { [key: number]: number } = {};
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  sessions.forEach((s) => {
    const day = getDay(new Date(s.started_at));
    timePerDay[day] = (timePerDay[day] || 0) + s.duration;
  });
  const productiveDayEntry = Object.entries(timePerDay).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const mostProductiveDay = productiveDayEntry
    ? {
        day: dayNames[parseInt(productiveDayEntry[0])],
        totalTime: productiveDayEntry[1],
      }
    : null;

  // 3. Subject Deep Dive
  const sessionsPerSubject: { [key: string]: number } = {};
  const timePerSubject: { [key: string]: number } = {};
  sessions.forEach((s) => {
    sessionsPerSubject[s.subject] = (sessionsPerSubject[s.subject] || 0) + 1;
    timePerSubject[s.subject] = (timePerSubject[s.subject] || 0) + s.duration;
  });

  const goToSubjectEntry = Object.entries(sessionsPerSubject).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const goToSubject = goToSubjectEntry
    ? { name: goToSubjectEntry[0], count: goToSubjectEntry[1] }
    : null;

  const enduranceSubjectEntry = Object.entries(timePerSubject)
    .map(([name, totalTime]) => ({
      name,
      avgLength: totalTime / sessionsPerSubject[name],
    }))
    .sort((a, b) => b.avgLength - a.avgLength)[0];
  const enduranceSubject = enduranceSubjectEntry
    ? {
        name: enduranceSubjectEntry.name,
        avgLength: enduranceSubjectEntry.avgLength,
      }
    : null;

  return {
    powerHour,
    mostProductiveDay,
    subjectDeepDive: { enduranceSubject, goToSubject },
  };
}
