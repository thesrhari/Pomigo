import { useQuery } from "@tanstack/react-query";
import {
  ActivityFeedService,
  ActivityFeedItem,
} from "@/lib/activity-feed-service";
import { useProStatus } from "./useProStatus";
import { useUser } from "./useUser";
import { useFriends } from "./useFriends";
import { User } from "@supabase/supabase-js";
import { useProfile } from "./useProfile";

const activityFeedService = new ActivityFeedService();

interface ActivityFeedState {
  activities: ActivityFeedItem[];
  isDisabled: boolean;
}

const fetchActivityFeed = async (
  isPro: boolean,
  user: User | null,
  friendIds: string[],
  isFeedEnabled: boolean
): Promise<ActivityFeedState> => {
  if (!user || !isFeedEnabled) {
    return { activities: [], isDisabled: true };
  }

  const activities = isPro
    ? await activityFeedService.getFriendActivityFeed(user, friendIds, {
        timeframeInHours: 168,
      })
    : await activityFeedService.getFriendActivityFeed(user, friendIds, {
        limit: 20,
      });

  return { activities, isDisabled: false };
};

export function useActivityFeed() {
  const { user, userId, isLoading: isUserLoading } = useUser();
  const { profile, loading: isProfileLoading } = useProfile();
  const { isPro, isLoading: isProLoading } = useProStatus();
  const { friends, isLoading: areFriendsLoading } = useFriends();

  const isFeedEnabled = profile?.activity_feed_enabled;
  const friendIds = friends.map((f) => f.id);

  const { data, error, isLoading, refetch } = useQuery<ActivityFeedState>({
    queryKey: ["activity-feed", isPro, userId, friendIds, isFeedEnabled],
    queryFn: () =>
      fetchActivityFeed(isPro, user || null, friendIds, isFeedEnabled!),
    // The query will not run until user, friends, and profile are loaded.
    enabled: !!user && !areFriendsLoading && !isProfileLoading,
    refetchInterval: 60000,
  });

  const refreshFeed = () => {
    refetch();
  };

  const combinedLoading =
    isLoading ||
    isUserLoading ||
    isProLoading ||
    areFriendsLoading ||
    isProfileLoading;

  return {
    activities: data?.activities || [],
    isDisabled: data?.isDisabled ?? combinedLoading,
    loading: combinedLoading,
    error: error ? (error as Error).message : null,
    refreshFeed,
  };
}
