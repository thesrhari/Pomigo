// hooks/use-activity-feed.ts
import useSWR from "swr";
import {
  ActivityFeedService,
  ActivityFeedItem,
} from "@/lib/activity-feed-service";
import { createClient } from "@/lib/supabase/client";
import { useProStatus } from "./useProStatus"; // Import the useProStatus hook
import { User } from "@supabase/supabase-js";

const activityFeedService = new ActivityFeedService();
const supabase = createClient();

interface ActivityFeedState {
  activities: ActivityFeedItem[];
  isDisabled: boolean;
}

// The fetcher function is updated to accept the `isPro` status from the SWR key.
const fetcher = async ([_key, isPro]: [
  string,
  boolean
]): Promise<ActivityFeedState> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user, treat as disabled
    return { activities: [], isDisabled: true };
  }

  // Check the current user's profile setting
  const { data: profile } = await supabase
    .from("profiles")
    .select("activity_feed_enabled")
    .eq("id", user.id)
    .single();

  // If the user has disabled their feed, return the disabled state
  if (!profile?.activity_feed_enabled) {
    return { activities: [], isDisabled: true };
  }

  // Fetch friend activity based on the user's pro status
  const activities = isPro
    ? await activityFeedService.getFriendActivityFeed({ timeframeInHours: 48 })
    : await activityFeedService.getFriendActivityFeed({ limit: 2 });

  return { activities, isDisabled: false };
};

export function useActivityFeed() {
  // Get the current user to determine their pro status
  const { data: user, isLoading: isUserLoading } = useSWR<User | null>(
    "auth-user",
    async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  );

  const { isPro, isLoading: isProLoading } = useProStatus(user || null);

  // The SWR key is now an array containing the `isPro` status.
  // SWR will re-fetch if this key changes. Fetching is disabled until the user is available.
  const { data, error, isLoading, mutate } = useSWR<ActivityFeedState>(
    user ? ["activity-feed", isPro] : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
    }
  );

  const refreshFeed = () => {
    mutate();
  };

  const combinedLoading = isLoading || isUserLoading || isProLoading;

  return {
    activities: data?.activities || [],
    isDisabled: data?.isDisabled ?? combinedLoading, // Return true if disabled or still loading
    loading: combinedLoading,
    error: error?.message || null,
    refreshFeed,
  };
}
