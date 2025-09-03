// hooks/use-friends.ts
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { useCallback } from "react";
import { FriendsService } from "@/lib/friends-service";
import type { SearchResult } from "@/types/friends";

// Initialize the FriendsService
const friendsService = new FriendsService();

// Define the keys for our SWR cache. This helps in easy revalidation.
const SWR_KEYS = {
  FRIENDS: "friends",
  INCOMING_REQUESTS: "incoming_requests",
  OUTGOING_REQUESTS: "outgoing_requests",
  BLOCKED_USERS: "blocked_users",
};

// A multi-fetcher function to fetch all data in parallel
const multiFetcher = async () => {
  const [friends, incomingRequests, outgoingRequests, blockedUsers] =
    await Promise.all([
      friendsService.getFriends(),
      friendsService.getIncomingRequests(),
      friendsService.getOutgoingRequests(),
      friendsService.getBlockedUsers(),
    ]);

  return {
    [SWR_KEYS.FRIENDS]: friends,
    [SWR_KEYS.INCOMING_REQUESTS]: incomingRequests,
    [SWR_KEYS.OUTGOING_REQUESTS]: outgoingRequests,
    [SWR_KEYS.BLOCKED_USERS]: blockedUsers,
  };
};

export function useFriends() {
  const { mutate } = useSWRConfig();

  // Fetch all data using a single useSWR hook with multiple keys
  const { data, error, isLoading } = useSWR(
    Object.values(SWR_KEYS),
    multiFetcher
  );

  // Function to revalidate all friend-related data
  const refreshData = useCallback(() => {
    mutate(Object.values(SWR_KEYS));
  }, [mutate]);

  const handleMutation = useCallback(
    async (mutationFn: () => Promise<any>) => {
      const result = await mutationFn();
      if (result.success) {
        refreshData();
      }
      return result;
    },
    [refreshData]
  );

  const sendFriendRequest = useCallback(
    (username: string) =>
      handleMutation(() => friendsService.sendFriendRequest(username)),
    [handleMutation]
  );

  const acceptFriendRequest = useCallback(
    (relationshipId: string) =>
      handleMutation(() => friendsService.acceptFriendRequest(relationshipId)),
    [handleMutation]
  );

  const declineFriendRequest = useCallback(
    (relationshipId: string) =>
      handleMutation(() => friendsService.declineFriendRequest(relationshipId)),
    [handleMutation]
  );

  const cancelFriendRequest = useCallback(
    (relationshipId: string) =>
      handleMutation(() => friendsService.cancelFriendRequest(relationshipId)),
    [handleMutation]
  );

  const removeFriend = useCallback(
    (relationshipId: string) =>
      handleMutation(() => friendsService.removeFriend(relationshipId)),
    [handleMutation]
  );

  const blockUser = useCallback(
    (userId: string) => handleMutation(() => friendsService.blockUser(userId)),
    [handleMutation]
  );

  const unblockUser = useCallback(
    (relationshipId: string) =>
      handleMutation(() => friendsService.unblockUser(relationshipId)),
    [handleMutation]
  );

  // Use useSWRMutation for the on-demand search functionality
  const { trigger: searchUsers, isMutating: isSearching } = useSWRMutation(
    "user_search",
    async (_, { arg }: { arg: string }): Promise<SearchResult[]> => {
      try {
        return await friendsService.searchUsers(arg);
      } catch (err) {
        console.error("Error searching users:", err);
        return [];
      }
    }
  );

  return {
    friends: data?.[SWR_KEYS.FRIENDS] ?? [],
    incomingRequests: data?.[SWR_KEYS.INCOMING_REQUESTS] ?? [],
    outgoingRequests: data?.[SWR_KEYS.OUTGOING_REQUESTS] ?? [],
    blockedUsers: data?.[SWR_KEYS.BLOCKED_USERS] ?? [],
    isLoading,
    isSearching,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    searchUsers,
    refreshData,
  };
}
