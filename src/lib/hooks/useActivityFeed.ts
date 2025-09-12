import { useQuery } from "@tanstack/react-query";
import {
  ActivityFeedService,
  ActivityFeedItem,
} from "@/lib/activity-feed-service";
import { createClient } from "@/lib/supabase/client";
import { useProStatus } from "./useProStatus";
import { useUser } from "./useUser";
import { User } from "@supabase/supabase-js";

const activityFeedService = new ActivityFeedService();
const supabase = createClient();

interface ActivityFeedState {
  activities: ActivityFeedItem[];
  isDisabled: boolean;
}

const fetchActivityFeed = async (
  isPro: boolean,
  userId: string | undefined,
  user: User | null
): Promise<ActivityFeedState> => {
  if (!userId) {
    return { activities: [], isDisabled: true };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("activity_feed_enabled")
    .eq("id", userId)
    .single();

  if (!profile?.activity_feed_enabled) {
    return { activities: [], isDisabled: true };
  }

  const activities = isPro
    ? await activityFeedService.getFriendActivityFeed(user, {
        timeframeInHours: 168,
      })
    : await activityFeedService.getFriendActivityFeed(user, { limit: 20 });

  return { activities, isDisabled: false };
};

export function useActivityFeed() {
  const { user, userId, isLoading: isUserLoading } = useUser();
  const { isPro, isLoading: isProLoading } = useProStatus();

  const { data, error, isLoading, refetch } = useQuery<ActivityFeedState>({
    queryKey: ["activity-feed", isPro, userId],
    queryFn: () => fetchActivityFeed(isPro, userId, user || null),
    enabled: !!user, // The query will not run until the user is available. [8, 12]
    refetchInterval: 60000,
  });

  const refreshFeed = () => {
    refetch();
  };

  const combinedLoading = isLoading || isUserLoading || isProLoading;

  return {
    activities: data?.activities || [],
    isDisabled: data?.isDisabled ?? combinedLoading,
    loading: combinedLoading,
    error: error ? (error as Error).message : null,
    refreshFeed,
  };
}
