// lib/friends-service.ts

import type {
  Profile,
  FriendRequest,
  Friend,
  SearchResult,
  FriendSystemError,
  BlockedUser, // Import the BlockedUser type
} from "@/types/friends";
import { createClient } from "./supabase/client";

export class FriendsService {
  private supabase = createClient();

  // ... (all other methods like sendFriendRequest, getFriends, etc., remain the same)
  // Send a friend request
  async sendFriendRequest(
    addresseeUsername: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
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

  // Get incoming friend requests
  async getIncomingRequests(): Promise<FriendRequest[]> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from("friend_relationships")
        .select(
          `
          id,
          created_at,
          requester:requester_id (
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `
        )
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching incoming requests:", error);
        return [];
      }

      const requests: FriendRequest[] = [];
      for (const item of data || []) {
        const requester = item.requester as any;
        if (requester) {
          // Get mutual friends count
          const { data: mutualCount } = await this.supabase.rpc(
            "get_mutual_friends_count",
            {
              user1_id: user.id,
              user2_id: requester.id,
            }
          );

          requests.push({
            id: requester.id,
            name: requester.display_name || requester.username,
            username: requester.username,
            avatar_url: requester.avatar_url,
            bio: requester.bio,
            mutual_friends: mutualCount || 0,
            timestamp: this.formatTimestamp(item.created_at),
            relationship_id: item.id,
          });
        }
      }

      return requests;
    } catch (error) {
      console.error("Error fetching incoming requests:", error);
      return [];
    }
  }

  // Get outgoing friend requests
  async getOutgoingRequests(): Promise<FriendRequest[]> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from("friend_relationships")
        .select(
          `
          id,
          created_at,
          addressee:addressee_id (
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `
        )
        .eq("requester_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching outgoing requests:", error);
        return [];
      }

      const requests: FriendRequest[] = [];
      for (const item of data || []) {
        const addressee = item.addressee as any;
        if (addressee) {
          // Get mutual friends count
          const { data: mutualCount } = await this.supabase.rpc(
            "get_mutual_friends_count",
            {
              user1_id: user.id,
              user2_id: addressee.id,
            }
          );

          requests.push({
            id: addressee.id,
            name: addressee.display_name || addressee.username,
            username: addressee.username,
            avatar_url: addressee.avatar_url,
            bio: addressee.bio,
            mutual_friends: mutualCount || 0,
            timestamp: this.formatTimestamp(item.created_at),
            relationship_id: item.id,
          });
        }
      }

      return requests;
    } catch (error) {
      console.error("Error fetching outgoing requests:", error);
      return [];
    }
  }

  // Get friends list
  async getFriends(): Promise<Friend[]> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from("friend_relationships")
        .select(
          `
          id,
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
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching friends:", error);
        return [];
      }

      return (data || []).map((item: any) => {
        const friend =
          item.requester_id === user.id ? item.addressee : item.requester;
        return {
          id: friend.id,
          name: friend.display_name || friend.username,
          username: friend.username,
          avatar_url: friend.avatar_url,
          bio: friend.bio,
          is_online: false, // You can implement online status separately
          relationship_id: item.id,
        };
      });
    } catch (error) {
      console.error("Error fetching friends:", error);
      return [];
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
    relationshipId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      const { error } = await this.supabase
        .from("friend_relationships")
        .update({ status: "declined" })
        .eq("id", relationshipId);

      if (error) {
        return {
          success: false,
          error: { message: "Failed to decline friend request" },
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error declining friend request:", error);
      return {
        success: false,
        error: { message: "An unexpected error occurred" },
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
    userId: string
  ): Promise<{ success: boolean; error?: FriendSystemError }> {
    try {
      const {
        data: { user: currentUser },
      } = await this.supabase.auth.getUser();
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

  // New method to get blocked users
  async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from("friend_relationships")
        .select(
          `
          id,
          addressee:addressee_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `
        )
        .eq("requester_id", user.id) // The current user is the one who initiated the block
        .eq("status", "blocked");

      if (error) {
        console.error("Error fetching blocked users:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.addressee.id,
        name: item.addressee.display_name || item.addressee.username,
        username: item.addressee.username,
        avatar_url: item.addressee.avatar_url,
        relationship_id: item.id,
      }));
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      return [];
    }
  }

  // New method to unblock a user
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
  async searchUsers(query: string): Promise<SearchResult[]> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return [];

      // Search for users by username
      const { data: profiles, error } = await this.supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio")
        .ilike("username", `%${query}%`)
        .neq("id", user.id) // Exclude current user
        .limit(10);

      console.log(profiles);

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
