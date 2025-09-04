"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { UserPlus, Users, Send, Shield } from "lucide-react";
import { useFriends } from "@/lib/hooks/useFriends";
import type { SearchResult } from "@/types/friends";
import FriendsPageSkeleton from "./components/FriendsSkeleton";
import AddFriendModal from "./components/AddFriendModal"; // Adjust path as needed
import FriendCard from "./components/FriendCard"; // Adjust path as needed
import { FriendsActivity } from "@/components/features/FriendsActivity";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<
    "friends" | "incoming" | "outgoing" | "blocked"
  >("friends");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    searchUsers,
  } = useFriends();

  // --- Handler Functions ---

  const handleSendRequest = async (username: string) => {
    try {
      const result = await sendFriendRequest(username);
      if (result.success) {
        toast.success("Friend request sent!");
        setShowAddFriendModal(false);
      } else {
        toast.error(result.error?.message || "Failed to send friend request.");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleAcceptRequest = async (relationshipId: string) => {
    try {
      const result = await acceptFriendRequest(relationshipId);
      if (result.success) {
        toast.success("Friend request accepted!");
      } else {
        toast.error(
          result.error?.message || "Failed to accept friend request."
        );
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleRejectRequest = async (relationshipId: string) => {
    try {
      const result = await declineFriendRequest(relationshipId);
      if (result.success) {
        toast.info("Friend request declined.");
      } else {
        toast.error(
          result.error?.message || "Failed to decline friend request."
        );
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleCancelRequest = async (relationshipId: string) => {
    try {
      const result = await cancelFriendRequest(relationshipId);
      if (result.success) {
        toast.info("Friend request cancelled.");
      } else {
        toast.error(
          result.error?.message || "Failed to cancel friend request."
        );
      }
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleRemoveFriend = async (relationshipId: string) => {
    try {
      const result = await removeFriend(relationshipId);
      if (result.success) {
        toast.info("Friend removed.");
      } else {
        toast.error(result.error?.message || "Failed to remove friend.");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const result = await blockUser(userId);
      if (result.success) {
        toast.success("User blocked.");
      } else {
        toast.error(result.error?.message || "Failed to block user.");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleUnblockUser = async (relationshipId: string) => {
    try {
      const result = await unblockUser(relationshipId);
      if (result.success) {
        toast.success("User unblocked.");
      } else {
        toast.error(result.error?.message || "Failed to unblock user.");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const getButtonState = (result: SearchResult) => {
    if (!result.relationship_status) {
      return { text: "Add", disabled: false, variant: "default" as const };
    }

    switch (result.relationship_status) {
      case "accepted":
        return {
          text: "Friends",
          disabled: true,
          variant: "secondary" as const,
        };
      case "pending":
        return result.is_requester
          ? { text: "Sent", disabled: true, variant: "secondary" as const }
          : { text: "Accept", disabled: false, variant: "default" as const };
      case "blocked":
        return {
          text: "Blocked",
          disabled: true,
          variant: "destructive" as const,
        };
      default:
        return { text: "Add", disabled: false, variant: "default" as const };
    }
  };

  const TabButton = ({
    tab,
    label,
    count,
    showCount = true,
  }: {
    tab: "friends" | "incoming" | "outgoing" | "blocked";
    label: string;
    count?: number;
    showCount?: boolean;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        activeTab === tab
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {label}
      {showCount && count !== undefined && count > 0 && (
        <Badge variant="secondary" className="ml-2 text-xs">
          {count}
        </Badge>
      )}
    </button>
  );

  if (isLoading) {
    return <FriendsPageSkeleton />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "friends":
        return friends.length > 0 ? (
          friends.map((friend) => (
            <FriendCard
              key={friend.id}
              user={friend}
              type="friend"
              onRemove={handleRemoveFriend}
              onBlock={handleBlockUser}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No friends yet. Start by adding some!
            </p>
          </div>
        );
      case "incoming":
        return incomingRequests.length > 0 ? (
          incomingRequests.map((request) => (
            <FriendCard
              key={request.id}
              user={request}
              type="incoming"
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending friend requests</p>
          </div>
        );
      case "outgoing":
        return outgoingRequests.length > 0 ? (
          outgoingRequests.map((request) => (
            <FriendCard
              key={request.id}
              user={request}
              type="outgoing"
              onCancel={handleCancelRequest}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No outgoing friend requests</p>
          </div>
        );
      case "blocked":
        return blockedUsers.length > 0 ? (
          blockedUsers.map((user) => (
            <FriendCard
              key={user.id}
              user={user}
              type="blocked"
              onUnblock={handleUnblockUser}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              You haven&apos;t blocked any users.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Friends</h1>
          <p className="text-muted-foreground">
            Connect with your study buddies
          </p>
        </div>
        <Button
          onClick={() => setShowAddFriendModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friends
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center p-1 bg-muted rounded-lg">
        <div className="flex flex-wrap gap-2">
          <TabButton tab="friends" label="Friends" count={friends.length} />
          <TabButton
            tab="incoming"
            label="Requests"
            count={incomingRequests.length}
          />
          <TabButton
            tab="outgoing"
            label="Sent"
            count={outgoingRequests.length}
          />
        </div>
        <div>
          <TabButton tab="blocked" label="Blocked" showCount={false} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">{renderContent()}</div>

        <FriendsActivity />
      </div>

      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSearch={searchUsers}
        onSendRequest={handleSendRequest}
        getButtonState={getButtonState}
      />
    </div>
  );
}
