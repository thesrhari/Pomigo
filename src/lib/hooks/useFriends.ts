// hooks/useFriends.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { FriendsService } from "@/lib/friends-service";
import { useUser } from "./useUser";
import type { SearchResult } from "@/types/friends";

const friendsService = new FriendsService();

export const queryKeys = {
  relationships: () => ["friends-data"] as const,
};

export function useFriends() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  // A boolean to ensure the query only runs when the user is authenticated.
  const isUserEnabled = !!user;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.relationships(),
    queryFn: () => friendsService.getAllRelationships(user),
    enabled: isUserEnabled,
    select: (data) => ({
      friends: data.friends ?? [],
      incomingRequests: data.incomingRequests ?? [],
      outgoingRequests: data.outgoingRequests ?? [],
      blockedUsers: data.blockedUsers ?? [],
    }),
  });

  // Generic mutation handler that invalidates the main relationships query on success.
  const useFriendMutation = <TData = unknown, TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<TData>
  ) => {
    return useMutation({
      mutationFn,
      onSuccess: () => {
        // Any successful mutation should invalidate our single source of truth.
        return queryClient.invalidateQueries({
          queryKey: queryKeys.relationships(),
        });
      },
    });
  };

  // All mutations now use the simplified helper, which automatically invalidates the correct query.
  const sendFriendRequestMutation = useFriendMutation((username: string) =>
    friendsService.sendFriendRequest(user, username)
  );

  const acceptFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.acceptFriendRequest(relationshipId)
  );

  const declineFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.declineFriendRequest(user, relationshipId)
  );

  const cancelFriendRequestMutation = useFriendMutation(
    (relationshipId: string) =>
      friendsService.cancelFriendRequest(relationshipId)
  );

  const removeFriendMutation = useFriendMutation((relationshipId: string) =>
    friendsService.removeFriend(relationshipId)
  );

  const blockUserMutation = useFriendMutation((userId: string) =>
    friendsService.blockUser(user, userId)
  );

  const unblockUserMutation = useFriendMutation((relationshipId: string) =>
    friendsService.unblockUser(relationshipId)
  );

  // Mutation for on-demand user search (this remains unchanged as it's a separate action).
  const searchUsersMutation = useMutation({
    mutationFn: (searchTerm: string): Promise<SearchResult[]> => {
      return friendsService.searchUsers(user, searchTerm);
    },
  });

  // Function to manually refresh all friend-related data.
  const refreshData = useCallback(() => {
    if (isUserEnabled) {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.relationships(),
      });
    }
    return Promise.resolve();
  }, [queryClient, isUserEnabled]);

  return {
    friends: data?.friends ?? [],
    incomingRequests: data?.incomingRequests ?? [],
    outgoingRequests: data?.outgoingRequests ?? [],
    blockedUsers: data?.blockedUsers ?? [],
    isLoading,
    isSearching: searchUsersMutation.isPending,
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
