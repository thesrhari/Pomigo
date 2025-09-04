// hooks/use-activity-feed.ts
import useSWR from "swr";
import {
  ActivityFeedService,
  ActivityFeedItem,
} from "@/lib/activity-feed-service";

const activityFeedService = new ActivityFeedService();

const fetcher = async () => {
  return await activityFeedService.getFriendActivityFeed(20);
};

export function useActivityFeed() {
  const { data, error, isLoading, mutate } = useSWR<ActivityFeedItem[]>(
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
    activities: data || [],
    loading: isLoading,
    error: error?.message || null,
    refreshFeed,
  };
}
