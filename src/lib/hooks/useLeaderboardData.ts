import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  format,
  isWithinInterval,
} from "date-fns";
import { useUser } from "./useUser";
import { useFriends } from "./useFriends";
import { useAnalyticsData } from "./useAnalyticsData";
import { useProfile } from "./useProfile";

// Define the shape of a friend's profile and their session data
export interface LeaderboardFriend {
  id: string;
  display_name: string;
  avatar_url: string;
  isOnline: boolean;
  streak: number;
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  dailyBreaks: number;
  weeklyBreaks: number;
  monthlyBreaks: number;
  yearlyBreaks: number;
}

const supabase = createClient();

// The fetcher function now only fetches friend sessions data
const fetchFriendSessionsData = async (friendIds: string[]) => {
  if (friendIds.length === 0) return [];

  // Fetch sessions for friends only
  const { data: friendSessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("user_id, session_type, duration, started_at")
    .in("user_id", friendIds);

  if (sessionsError) throw sessionsError;

  return friendSessions || [];
};

// Helper function to process sessions data into metrics
const processSessionsIntoMetrics = (
  sessions: Array<{
    user_id: string;
    session_type: string;
    duration: number;
    started_at: string;
  }>,
  userIds: string[]
) => {
  const userMetrics = new Map<
    string,
    Omit<LeaderboardFriend, "id" | "display_name" | "avatar_url">
  >();

  // Initialize metrics for all users
  userIds.forEach((id) => {
    userMetrics.set(id, {
      isOnline: false,
      streak: 0,
      dailyHours: 0,
      weeklyHours: 0,
      monthlyHours: 0,
      yearlyHours: 0,
      dailyBreaks: 0,
      weeklyBreaks: 0,
      monthlyBreaks: 0,
      yearlyBreaks: 0,
    });
  });

  const now = new Date();
  const intervals = {
    day: { start: startOfDay(now), end: endOfDay(now) },
    week: {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    },
    month: { start: startOfMonth(now), end: endOfMonth(now) },
    year: { start: startOfYear(now), end: endOfYear(now) },
  };

  sessions.forEach((session) => {
    const metrics = userMetrics.get(session.user_id);
    if (!metrics || !session.duration) return;

    const sessionDate = new Date(session.started_at);
    const durationInHours = session.duration / 60;
    const isStudy = session.session_type === "study";

    if (isWithinInterval(sessionDate, intervals.day)) {
      isStudy
        ? (metrics.dailyHours += durationInHours)
        : (metrics.dailyBreaks += durationInHours);
    }
    if (isWithinInterval(sessionDate, intervals.week)) {
      isStudy
        ? (metrics.weeklyHours += durationInHours)
        : (metrics.weeklyBreaks += durationInHours);
    }
    if (isWithinInterval(sessionDate, intervals.month)) {
      isStudy
        ? (metrics.monthlyHours += durationInHours)
        : (metrics.monthlyBreaks += durationInHours);
    }
    if (isWithinInterval(sessionDate, intervals.year)) {
      isStudy
        ? (metrics.yearlyHours += durationInHours)
        : (metrics.yearlyBreaks += durationInHours);
    }
  });

  // Calculate streaks for each user
  userIds.forEach((userId) => {
    const userStudySessions = sessions.filter(
      (s) => s.user_id === userId && s.session_type === "study"
    );
    const metrics = userMetrics.get(userId)!;
    metrics.streak = calculateStreaks(userStudySessions).currentStreak;
  });

  return userMetrics;
};

export function useLeaderboardData() {
  const { user } = useUser();
  const { profile } = useProfile();
  const { friends, isLoading: isLoadingFriends } = useFriends();

  // Get current user's analytics data (includes all sessions)
  const { allSessions: currentUserSessions, loading: isLoadingAnalytics } =
    useAnalyticsData(
      { type: "all-time" }, // We need all-time data for leaderboard calculations
      new Date().getFullYear()
    );

  // Extract friend IDs
  const friendIds = friends.map((friend) => friend.id);

  // Fetch friend sessions data
  const {
    data: friendSessions,
    error: friendSessionsError,
    isLoading: isLoadingFriendSessions,
  } = useQuery({
    queryKey: ["friendSessions", friendIds],
    queryFn: () => fetchFriendSessionsData(friendIds),
    enabled: !!user && friendIds.length > 0 && !isLoadingFriends,
  });

  const { data, error, isLoading } = useQuery({
    queryKey: [
      "leaderboardData",
      user?.id,
      friendIds,
      currentUserSessions?.length,
      friendSessions?.length,
    ],
    queryFn: async () => {
      if (!user || !currentUserSessions || !friendSessions) {
        throw new Error("Missing required data");
      }

      // Convert current user sessions to the expected format
      const currentUserSessionsFormatted = currentUserSessions.map(
        (session) => ({
          user_id: user.id,
          session_type: session.session_type,
          duration: session.duration,
          started_at: session.started_at,
        })
      );

      // Combine all sessions
      const allSessions = [...currentUserSessionsFormatted, ...friendSessions];
      const allUserIds = [user.id, ...friendIds];

      // Process sessions into metrics
      const userMetrics = processSessionsIntoMetrics(allSessions, allUserIds);

      // Create profiles map from friends data and current user
      const profilesMap = new Map();

      // Add current user profile (assuming it exists in user object)
      profilesMap.set(user.id, {
        id: user.id,
        display_name: profile?.display_name || user.email || "You",
        avatar_url: profile?.avatar_url || "🧑‍💻",
      });

      // Add friend profiles
      friends.forEach((friend) => {
        profilesMap.set(friend.id, {
          id: friend.id,
          display_name: friend.name,
          avatar_url: friend.avatar_url,
        });
      });

      // Create final processed data
      const processedData: LeaderboardFriend[] = allUserIds.map((id) => {
        const metrics = userMetrics.get(id)!;
        const profile = profilesMap.get(id);

        return {
          id,
          display_name: profile?.display_name || "Friend",
          avatar_url: profile?.avatar_url || "🧑‍💻",
          ...metrics,
        };
      });

      const currentUserData =
        processedData.find((p) => p.id === user.id) || null;
      const friendsData = processedData.filter((p) => p.id !== user.id);

      return { friends: friendsData, currentUserData };
    },
    enabled:
      !!user &&
      !!currentUserSessions &&
      !!friendSessions &&
      !isLoadingFriends &&
      !isLoadingAnalytics,
  });

  return {
    friends: data?.friends || [],
    currentUserData: data?.currentUserData || null,
    loading:
      isLoading ||
      isLoadingFriends ||
      isLoadingAnalytics ||
      isLoadingFriendSessions,
    error: error?.message || friendSessionsError?.message || null,
  };
}

// Helper function for streak calculation (no changes needed)
function calculateStreaks(sessions: { started_at: string }[]): {
  currentStreak: number;
} {
  if (sessions.length === 0) return { currentStreak: 0 };
  const uniqueDays = [
    ...new Set(sessions.map((s) => s.started_at.split("T")[0])),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (uniqueDays.length === 0) return { currentStreak: 0 };
  let currentStreak = 0;
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
  return { currentStreak };
}
