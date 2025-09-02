"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MessageCircle,
  Activity,
  UserPlus,
  X,
  Users,
  Clock,
  Send,
  Check,
  Search,
  UserX,
  Shield,
  MoreHorizontal,
  ShieldOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFriends } from "@/lib/hooks/useFriends";
import type { SearchResult } from "@/types/friends";
import FriendsPageSkeleton from "./components/FriendsSkeleton"; // Import the skeleton component

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<
    "friends" | "incoming" | "outgoing" | "blocked" // Add 'blocked' to the type
  >("friends");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers, // Destructure blockedUsers
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser, // Destructure unblockUser
    searchUsers,
  } = useFriends();

  // --- Handler Functions ---

  const handleSearch = async () => {
    if (!searchUsername.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchUsers(searchUsername.replace("@", ""));
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search for users.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (username: string) => {
    try {
      const result = await sendFriendRequest(username);
      if (result.success) {
        toast.success("Friend request sent!");
        setSearchResults([]);
        setSearchUsername("");
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

  // New handler for unblocking a user
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

  // Use the new skeleton component when isLoading is true
  if (isLoading) {
    return <FriendsPageSkeleton />;
  }

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
        {/* Left-aligned tabs */}
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

        {/* Right-aligned tab */}
        <div>
          <TabButton tab="blocked" label="Blocked" showCount={false} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "friends" && (
            <>
              {friends.map((friend) => (
                <Card
                  key={friend.id}
                  className="border-border bg-card hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-medium">
                            {friend.avatar_url ? (
                              <img
                                src={friend.avatar_url}
                                alt={friend.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              friend.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {friend.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleRemoveFriend(friend.relationship_id)
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Remove Friend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBlockUser(friend.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Block User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {friends.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No friends yet. Start by adding some!
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "incoming" && (
            <>
              {incomingRequests.map((request) => (
                <Card key={request.id} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-medium">
                          {request.avatar_url ? (
                            <img
                              src={request.avatar_url}
                              alt={request.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            request.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {request.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{request.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAcceptRequest(request.relationship_id)
                          }
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRejectRequest(request.relationship_id)
                          }
                          className="border-border"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {incomingRequests.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No pending friend requests
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "outgoing" && (
            <>
              {outgoingRequests.map((request) => (
                <Card key={request.id} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-medium">
                          {request.avatar_url ? (
                            <img
                              src={request.avatar_url}
                              alt={request.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            request.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {request.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{request.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-border">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCancelRequest(request.relationship_id)
                          }
                          className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {outgoingRequests.length === 0 && (
                <div className="text-center py-12">
                  <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No outgoing friend requests
                  </p>
                </div>
              )}
            </>
          )}

          {/* New Blocked Users Tab Content */}
          {activeTab === "blocked" && (
            <>
              {blockedUsers.map((user) => (
                <Card key={user.id} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-lg font-medium">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {user.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockUser(user.relationship_id)}
                        className="border-border"
                      >
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Unblock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {blockedUsers.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    You haven&apos;t blocked any users.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <Card className="border-border bg-card h-fit">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Activity className="w-5 h-5" />
              <span>Friend Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Friend activity feed coming soon!
            </p>
          </CardContent>
        </Card>
      </div>

      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Add Friends</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddFriendModal(false);
                    setSearchResults([]);
                    setSearchUsername("");
                  }}
                  className="text-muted-foreground hover:text-card-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter username (e.g., @username)"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  className="flex-1 border-border bg-background"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchUsername.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {isSearching && (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => {
                    const buttonState = getButtonState(user);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-card-foreground">
                              {user.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={buttonState.variant}
                          onClick={() => {
                            if (buttonState.text === "Add") {
                              handleSendRequest(user.username);
                            }
                          }}
                          disabled={buttonState.disabled}
                        >
                          {buttonState.text}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
