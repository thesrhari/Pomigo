// hooks/use-friends.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { FriendsService } from "@/lib/friends-service";
import { useUser } from "./useUser";
import type { SearchResult } from "@/types/friends";

// Initialize the FriendsService
const friendsService = new FriendsService();

// Define the keys for our TanStack Query cache.
// Using 'as const' makes these readonly tuples for better type-safety.
export const queryKeys = {
  all: ["friends-data"] as const,
  friends: () => [...queryKeys.all, "friends"] as const,
  incoming: () => [...queryKeys.all, "incoming_requests"] as const,
  outgoing: () => [...queryKeys.all, "outgoing_requests"] as const,
  blocked: () => [...queryKeys.all, "blocked_users"] as const,
};

export function useFriends() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  // A boolean to ensure queries only run when the user is authenticated.
  const isUserEnabled = !!user;

  // Fetch all friend-related data in parallel using separate useQuery hooks
  const { data: friendsData, isLoading: isLoadingFriends } = useQuery({
    queryKey: queryKeys.friends(),
    queryFn: () => friendsService.getFriends(user),
    enabled: isUserEnabled,
  });

  const { data: incomingRequestsData, isLoading: isLoadingIncoming } = useQuery(
    {
      queryKey: queryKeys.incoming(),
      queryFn: () => friendsService.getIncomingRequests(user),
      enabled: isUserEnabled,
    }
  );

  const { data: outgoingRequestsData, isLoading: isLoadingOutgoing } = useQuery(
    {
      queryKey: queryKeys.outgoing(),
      queryFn: () => friendsService.getOutgoingRequests(user),
      enabled: isUserEnabled,
    }
  );

  const { data: blockedUsersData, isLoading: isLoadingBlocked } = useQuery({
    queryKey: queryKeys.blocked(),
    queryFn: () => friendsService.getBlockedUsers(user),
    enabled: isUserEnabled,
  });

  // Generic mutation handler to invalidate relevant queries on success
  const useFriendMutation = <TData = unknown, TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    queriesToInvalidate: ReadonlyArray<Readonly<unknown[]>>
  ) => {
    return useMutation({
      mutationFn,
      onSuccess: () => {
        return Promise.all(
          queriesToInvalidate.map((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      },
    });
  };

  const sendFriendRequestMutation = useFriendMutation(
    (username: string) => friendsService.sendFriendRequest(user, username),
    [queryKeys.outgoing()]
  );

  const acceptFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.acceptFriendRequest(relationshipId),
    [queryKeys.friends(), queryKeys.incoming()]
  );

  const declineFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.declineFriendRequest(user, relationshipId),
    [queryKeys.incoming()]
  );

  const cancelFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.cancelFriendRequest(relationshipId),
    [queryKeys.outgoing()]
  );

  const removeFriendMutation = useFriendMutation(
    (relationshipId: string) => friendsService.removeFriend(relationshipId),
    [queryKeys.friends()]
  );

  const blockUserMutation = useFriendMutation(
    (userId: string) => friendsService.blockUser(user, userId),
    [
      queryKeys.blocked(),
      queryKeys.friends(),
      queryKeys.incoming(),
      queryKeys.outgoing(),
    ]
  );

  const unblockUserMutation = useFriendMutation(
    (relationshipId: string) => friendsService.unblockUser(relationshipId),
    [queryKeys.blocked()]
  );

  // Mutation for on-demand user search
  const searchUsersMutation = useMutation({
    mutationFn: (searchTerm: string): Promise<SearchResult[]> => {
      return friendsService.searchUsers(user, searchTerm);
    },
  });

  // Function to manually refresh all friend-related data
  const refreshData = useCallback(() => {
    // Only attempt to refresh if the user is available
    if (isUserEnabled) {
      return queryClient.invalidateQueries({ queryKey: queryKeys.all });
    }
    return Promise.resolve();
  }, [queryClient, isUserEnabled]);

  return {
    friends: friendsData ?? [],
    incomingRequests: incomingRequestsData ?? [],
    outgoingRequests: outgoingRequestsData ?? [],
    blockedUsers: blockedUsersData ?? [],
    isLoading:
      // When queries are disabled, their status is 'pending', not 'loading'.
      // We should check if the user is loaded first. If not, we are loading.
      !isUserEnabled ||
      isLoadingFriends ||
      isLoadingIncoming ||
      isLoadingOutgoing ||
      isLoadingBlocked,
    isSearching: searchUsersMutation.isPending,
    // Expose mutation functions to be called from components
    sendFriendRequest: sendFriendRequestMutation.mutateAsync,
    acceptFriendRequest: acceptFriendRequestMutation.mutateAsync,
    declineFriendRequest: declineFriendRequestMutation.mutateAsync,
    cancelFriendRequest: cancelFriendRequestMutation.mutateAsync,
    removeFriend: removeFriendMutation.mutateAsync,
    blockUser: blockUserMutation.mutateAsync,
    unblockUser: unblockUserMutation.mutateAsync,
    searchUsers: searchUsersMutation.mutateAsync,
    refreshData,
  };
}
