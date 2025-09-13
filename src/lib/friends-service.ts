// lib/friends-service.ts
import type {
  FriendRequest,
  Friend,
  SearchResult,
  FriendSystemError,
  BlockedUser,
} from "@/types/friends";
import { createClient } from "./supabase/client";
import { User } from "@supabase/supabase-js";

export class FriendsService {
  private supabase = createClient();

  // Send a friend request
  async sendFriendRequest(
    user: User | null | undefined,
    addresseeUsername: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      if (!user) {
        return { success: false, error: { message: "Not authenticated" } };
      }

      // Get addressee profile
      const { data: addresseeProfile, error: profileError } =
        await this.supabase
          .from("profiles")
          .select("id, username")
          .ilike("username", addresseeUsername)
          .single();

      if (profileError || !addresseeProfile) {
        return { success: false, error: { message: "User not found" } };
      }

      if (addresseeProfile.id === user.id) {
        return {
          success: false,
          error: { message: "Cannot send friend request to yourself" },
        };
      }

      // Check if relationship already exists
      const { data: existingRelationship } = await this.supabase
        .from("friend_relationships")
        .select("id, status, requester_id, addressee_id")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeProfile.id}),and(requester_id.eq.${addresseeProfile.id},addressee_id.eq.${user.id})`
        )
        .single();

      if (existingRelationship) {
        if (existingRelationship.status === "accepted") {
          return {
            success: false,
            error: { message: "Already friends with this user" },
          };
        }
        if (existingRelationship.status === "pending") {
          if (existingRelationship.requester_id === user.id) {
            return {
              success: false,
              error: { message: "Friend request already sent" },
            };
          } else {
            return {
              success: false,
              error: {
                message: "This user has already sent you a friend request",
              },
            };
          }
        }
        if (existingRelationship.status === "blocked") {
          return {
            success: false,
            error: { message: "Cannot send friend request to this user" },
          };
        }
      }

      // Send friend request
      const { error: insertError } = await this.supabase
        .from("friend_relationships")
        .insert({
          requester_id: user.id,
          addressee_id: addresseeProfile.id,
          status: "pending",
        });

      if (insertError) {
        return {
          success: false,
          error: { message: "Failed to send friend request" },
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending friend request:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred" },
      };
    }
  }

  // Get all relationships (accepted, pending, blocked) in a single call
  async getAllRelationships(user: User | null | undefined): Promise<{
    friends: Friend[];
    incomingRequests: FriendRequest[];
    outgoingRequests: FriendRequest[];
    blockedUsers: BlockedUser[];
  }> {
    const emptyState = {
      friends: [],
      incomingRequests: [],
      outgoingRequests: [],
      blockedUsers: [],
    };

    try {
      if (!user) return emptyState;

      const { data, error } = await this.supabase
        .from("friend_relationships")
        .select(
          `
          id,
          created_at,
          updated_at,
          status,
          requester_id,
          addressee_id,
          requester:requester_id (
            id,
            username,
            display_name,
            avatar_url,
            bio
          ),
          addressee:addressee_id (
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `
        )
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) {
        console.error("Error fetching relationships:", error);
        return emptyState;
      }

      const friends: Friend[] = [];
      const incomingRequests: FriendRequest[] = [];
      const outgoingRequests: FriendRequest[] = [];
      const blockedUsers: BlockedUser[] = [];

      for (const item of data || []) {
        const { id, status, requester_id, created_at, requester, addressee } =
          item as any;
        const otherUser = requester_id === user.id ? addressee : requester;

        if (!otherUser) continue;

        const mutualFriendsCount =
          (
            await this.supabase.rpc("get_mutual_friends_count", {
              user1_id: user.id,
              user2_id: otherUser.id,
            })
          ).data || 0;

        switch (status) {
          case "accepted":
            friends.push({
              id: otherUser.id,
              name: otherUser.display_name || otherUser.username,
              username: otherUser.username,
              avatar_url: otherUser.avatar_url,
              bio: otherUser.bio,
              is_online: false, // Implement online status separately
              relationship_id: id,
            });
            break;

          case "pending":
            const request = {
              id: otherUser.id,
              name: otherUser.display_name || otherUser.username,
              username: otherUser.username,
              avatar_url: otherUser.avatar_url,
              bio: otherUser.bio,
              mutual_friends: mutualFriendsCount,
              timestamp: this.formatTimestamp(created_at),
              relationship_id: id,
            };
            if (requester_id === user.id) {
              outgoingRequests.push(request);
            } else {
              incomingRequests.push(request);
            }
            break;

          case "blocked":
            if (requester_id === user.id) {
              blockedUsers.push({
                id: otherUser.id,
                name: otherUser.display_name || otherUser.username,
                username: otherUser.username,
                avatar_url: otherUser.avatar_url,
                relationship_id: id,
              });
            }
            break;
        }
      }

      return { friends, incomingRequests, outgoingRequests, blockedUsers };
    } catch (error) {
      console.error("Error fetching relationships:", error);
      return emptyState;
    }
  }

  // Accept friend request
  async acceptFriendRequest(
    relationshipId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      const { error } = await this.supabase
        .from("friend_relationships")
        .update({ status: "accepted" })
        .eq("id", relationshipId);

      if (error) {
        return {
          success: false,
          error: { message: "Failed to accept friend request" },
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error accepting friend request:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred" },
      };
    }
  }

  // Decline friend request
  async declineFriendRequest(
    user: User | null | undefined,
    relationshipId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      if (!user) {
        return { success: false, error: { message: "Not authenticated" } };
      }

      const { data: relationship, error: fetchError } = await this.supabase
        .from("friend_relationships")
        .select("requester_id, addressee_id")
        .eq("id", relationshipId)
        .single();

      if (fetchError || !relationship) {
        return {
          success: false,
          error: { message: "Failed to find the friend request." },
        };
      }

      const { error } = await this.supabase
        .from("friend_relationships")
        .update({
          status: "blocked",
          requester_id: user.id, // The current user is blocking the sender
          addressee_id: relationship.requester_id, // The sender of the request is being blocked
        })
        .eq("id", relationshipId);

      if (error) {
        return {
          success: false,
          error: { message: "Failed to block the user." },
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error declining and blocking user:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred." },
      };
    }
  }

  // Cancel friend request
  async cancelFriendRequest(
    relationshipId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      const { error } = await this.supabase
        .from("friend_relationships")
        .delete()
        .eq("id", relationshipId);

      if (error) {
        return {
          success: false,
          error: { message: "Failed to cancel friend request" },
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error canceling friend request:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred" },
      };
    }
  }

  // Remove friend
  async removeFriend(
    relationshipId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      const { error } = await this.supabase
        .from("friend_relationships")
        .delete()
        .eq("id", relationshipId);

      if (error) {
        return {
          success: false,
          error: { message: "Failed to remove friend" },
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error removing friend:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred" },
      };
    }
  }

  // Block user
  async blockUser(
    currentUser: User | null | undefined,
    userId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      if (!currentUser) {
        return { success: false, error: { message: "Not authenticated" } };
      }

      // Check if relationship exists
      const { data: existingRelationship } = await this.supabase
        .from("friend_relationships")
        .select("id, requester_id, addressee_id")
        .or(
          `and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`
        )
        .single();

      if (existingRelationship) {
        // Update existing relationship
        const { error } = await this.supabase
          .from("friend_relationships")
          .update({
            status: "blocked",
            requester_id: currentUser.id,
            addressee_id: userId,
          })
          .eq("id", existingRelationship.id);

        if (error) {
          return { success: false, error: { message: "Failed to block user" } };
        }
      } else {
        // Create new blocked relationship
        const { error } = await this.supabase
          .from("friend_relationships")
          .insert({
            requester_id: currentUser.id,
            addressee_id: userId,
            status: "blocked",
          });

        if (error) {
          return { success: false, error: { message: "Failed to block user" } };
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error blocking user:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred" },
      };
    }
  }

  // Unblock a user
  async unblockUser(
    relationshipId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      // Unblocking a user is the same as deleting the relationship record
      const { error } = await this.supabase
        .from("friend_relationships")
        .delete()
        .eq("id", relationshipId);

      if (error) {
        return {
          success: false,
          error: { message: "Failed to unblock user" },
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error unblocking user:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred" },
      };
    }
  }

  // Search users
  async searchUsers(
    user: User | null | undefined,
    query: string
  ): Promise<SearchResult[]> {
    try {
      if (!user) return [];

      // Search for users by username
      const { data: profiles, error } = await this.supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio")
        .ilike("username", `%${query}%`)
        .neq("id", user.id) // Exclude current user
        .limit(10);

      if (error) {
        console.error("Error searching users:", error);
        return [];
      }

      const results: SearchResult[] = [];
      for (const profile of profiles || []) {
        // Get mutual friends count
        const { data: mutualCount } = await this.supabase.rpc(
          "get_mutual_friends_count",
          {
            user1_id: user.id,
            user2_id: profile.id,
          }
        );

        // Check existing relationship
        const { data: relationship } = await this.supabase
          .from("friend_relationships")
          .select("status, requester_id")
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
          )
          .single();

        results.push({
          id: profile.id,
          name: profile.display_name || profile.username,
          username: profile.username,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          mutual_friends: mutualCount || 0,
          relationship_status: relationship?.status || null,
          is_requester: relationship?.requester_id === user.id,
        });
      }

      return results;
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  }

  private formatTimestamp(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
