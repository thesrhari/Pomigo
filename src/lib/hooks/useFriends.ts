// hooks/use-friends.ts
import { useState, useEffect, useCallback } from "react";
import { FriendsService } from "@/lib/friends-service";
import type {
  Friend,
  FriendRequest,
  SearchResult,
  BlockedUser,
} from "@/types/friends"; // Import BlockedUser type

const friendsService = new FriendsService();

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]); // State for blocked users
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [friendsData, incomingData, outgoingData, blockedData] =
        await Promise.all([
          friendsService.getFriends(),
          friendsService.getIncomingRequests(),
          friendsService.getOutgoingRequests(),
          friendsService.getBlockedUsers(), // Fetch blocked users
        ]);

      setFriends(friendsData);
      setIncomingRequests(incomingData);
      setOutgoingRequests(outgoingData);
      setBlockedUsers(blockedData); // Set blocked users state
    } catch (err) {
      console.error("Error loading friend data:", err);
      setError("Failed to load friend data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendFriendRequest = useCallback(
    async (username: string) => {
      const result = await friendsService.sendFriendRequest(username);
      if (result.success) await loadData();
      return result;
    },
    [loadData]
  );

  const acceptFriendRequest = useCallback(
    async (relationshipId: string) => {
      const result = await friendsService.acceptFriendRequest(relationshipId);
      if (result.success) await loadData();
      return result;
    },
    [loadData]
  );

  const declineFriendRequest = useCallback(
    async (relationshipId: string) => {
      const result = await friendsService.declineFriendRequest(relationshipId);
      if (result.success) await loadData();
      return result;
    },
    [loadData]
  );

  const cancelFriendRequest = useCallback(
    async (relationshipId: string) => {
      const result = await friendsService.cancelFriendRequest(relationshipId);
      if (result.success) await loadData();
      return result;
    },
    [loadData]
  );

  const removeFriend = useCallback(
    async (relationshipId: string) => {
      const result = await friendsService.removeFriend(relationshipId);
      if (result.success) await loadData();
      return result;
    },
    [loadData]
  );

  const blockUser = useCallback(
    async (userId: string) => {
      const result = await friendsService.blockUser(userId);
      if (result.success) await loadData();
      return result;
    },
    [loadData]
  );

  // New function to unblock a user
  const unblockUser = useCallback(
    async (relationshipId: string) => {
      const result = await friendsService.unblockUser(relationshipId);
      if (result.success) await loadData();
      return result;
    },
    [loadData]
  );

  const searchUsers = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      try {
        return await friendsService.searchUsers(query);
      } catch (err) {
        console.error("Error searching users:", err);
        return [];
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers, // Export blocked users
    isLoading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser, // Export unblock function
    searchUsers,
    refreshData: loadData,
  };
}
