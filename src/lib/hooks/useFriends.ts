// hooks/use-friends.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { FriendsService } from "@/lib/friends-service";
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

  // Fetch all friend-related data in parallel using separate useQuery hooks
  const { data: friendsData, isLoading: isLoadingFriends } = useQuery({
    queryKey: queryKeys.friends(),
    queryFn: () => friendsService.getFriends(),
  });

  const { data: incomingRequestsData, isLoading: isLoadingIncoming } = useQuery(
    {
      queryKey: queryKeys.incoming(),
      queryFn: () => friendsService.getIncomingRequests(),
    }
  );

  const { data: outgoingRequestsData, isLoading: isLoadingOutgoing } = useQuery(
    {
      queryKey: queryKeys.outgoing(),
      queryFn: () => friendsService.getOutgoingRequests(),
    }
  );

  const { data: blockedUsersData, isLoading: isLoadingBlocked } = useQuery({
    queryKey: queryKeys.blocked(),
    queryFn: () => friendsService.getBlockedUsers(),
  });

  // Generic mutation handler to invalidate relevant queries on success
  const useFriendMutation = <TData = unknown, TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    // CORRECTED TYPE: Now correctly accepts readonly tuples from queryKeys
    queriesToInvalidate: ReadonlyArray<Readonly<unknown[]>>
  ) => {
    return useMutation({
      mutationFn,
      onSuccess: () => {
        // Invalidate each query key passed in
        return Promise.all(
          queriesToInvalidate.map((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      },
    });
  };

  // Mutations for various friend actions
  const sendFriendRequestMutation = useFriendMutation(
    (username: string) => friendsService.sendFriendRequest(username),
    [queryKeys.outgoing()]
  );

  const acceptFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.acceptFriendRequest(relationshipId),
    [queryKeys.friends(), queryKeys.incoming()]
  );

  const declineFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.declineFriendRequest(relationshipId),
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
    (userId: string) => friendsService.blockUser(userId),
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
      return friendsService.searchUsers(searchTerm);
    },
  });

  // Function to manually refresh all friend-related data
  const refreshData = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.all });
  }, [queryClient]);

  return {
    friends: friendsData ?? [],
    incomingRequests: incomingRequestsData ?? [],
    outgoingRequests: outgoingRequestsData ?? [],
    blockedUsers: blockedUsersData ?? [],
    isLoading:
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
