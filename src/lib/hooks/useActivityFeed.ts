// hooks/use-activity-feed.ts
import useSWR from "swr";
import {
  ActivityFeedService,
  ActivityFeedItem,
} from "@/lib/activity-feed-service";
import { createClient } from "@/lib/supabase/client";

const activityFeedService = new ActivityFeedService();
const supabase = createClient();

interface ActivityFeedState {
  activities: ActivityFeedItem[];
  isDisabled: boolean;
}

const fetcher = async (): Promise<ActivityFeedState> => {
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

  // Otherwise, fetch the friend activity feed as normal
  const activities = await activityFeedService.getFriendActivityFeed(20);
  return { activities, isDisabled: false };
};

export function useActivityFeed() {
  const { data, error, isLoading, mutate } = useSWR<ActivityFeedState>(
    "activity-feed",
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

  return {
    activities: data?.activities || [],
    isDisabled: data?.isDisabled ?? isLoading, // Return true if disabled or still loading
    loading: isLoading,
    error: error?.message || null,
    refreshFeed,
  };
}
