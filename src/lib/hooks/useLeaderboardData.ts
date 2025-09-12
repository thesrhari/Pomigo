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
import { useUser } from "./useUser"; // Assuming useUser is in the same directory
import { User } from "@supabase/supabase-js";

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

// The fetcher function now accepts the user object as a parameter.
const fetchLeaderboardData = async (user: User) => {
  if (!user) throw new Error("User not authenticated.");

  // 1. Get friend relationships
  const { data: friendRelationships, error: friendsError } = await supabase
    .from("friend_relationships")
    .select(
      "requester_id, addressee_id, requester:profiles!requester_id(display_name, avatar_url), addressee:profiles!addressee_id(display_name, avatar_url)"
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");
  if (friendsError) throw friendsError;

  const friendProfiles = (friendRelationships || []).map((fr) => {
    const isRequester = fr.requester_id === user.id;
    return {
      id: isRequester ? fr.addressee_id : fr.requester_id,
      profile: isRequester ? fr.addressee : fr.requester,
    };
  });

  const friendIds = friendProfiles.map((f) => f.id);
  const allUserIds = [...new Set([...friendIds, user.id])];

  // 2. Fetch all sessions for user and friends
  const { data: allSessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("user_id, session_type, duration, started_at")
    .in("user_id", allUserIds);
  if (sessionsError) throw sessionsError;

  // 3. Fetch all necessary profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", allUserIds);
  if (profilesError) throw profilesError;
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // 4. Process the data
  const userMetrics = new Map<
    string,
    Omit<LeaderboardFriend, "id" | "display_name" | "avatar_url">
  >();
  allUserIds.forEach((id) => {
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

  (allSessions || []).forEach((session) => {
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

  // Calculate streaks and finalize data structure
  const processedData: LeaderboardFriend[] = allUserIds.map((id) => {
    const metrics = userMetrics.get(id)!;
    const userStudySessions = (allSessions || []).filter(
      (s) => s.user_id === id && s.session_type === "study"
    );
    metrics.streak = calculateStreaks(userStudySessions).currentStreak;

    const profile = profileMap.get(id);
    return {
      id,
      display_name: profile?.display_name || "Friend",
      avatar_url: profile?.avatar_url || "🧑‍💻",
      ...metrics,
    };
  });

  const currentUserData = processedData.find((p) => p.id === user.id) || null;
  const friends = processedData.filter((p) => p.id !== user.id);

  return { friends, currentUserData };
};

export function useLeaderboardData() {
  const { user } = useUser();
  const { data, error, isLoading } = useQuery({
    queryKey: ["leaderboardData", user?.id],
    queryFn: () => fetchLeaderboardData(user!),
    enabled: !!user, // The query will not run until the user is fetched
  });

  return {
    friends: data?.friends || [],
    currentUserData: data?.currentUserData || null,
    loading: isLoading,
    error: error?.message || null,
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
