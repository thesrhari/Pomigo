"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Heart,
  Flame,
  Activity,
  UserPlus,
  X,
  Users,
  Clock,
  Send,
  Check,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Friend {
  name: string;
  username: string;
  status: string;
  avatar: string;
  streak: number;
  isOnline: boolean;
  hoursToday: number;
}

interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
  mutualFriends: number;
  timestamp: string;
}

const friends: Friend[] = [
  {
    name: "Sarah Chen",
    username: "@sarahc",
    status: "studying Physics",
    avatar: "👩‍💻",
    streak: 12,
    isOnline: true,
    hoursToday: 3.2,
  },
  {
    name: "Alex Kumar",
    username: "@alexk",
    status: "completed 4 pomodoros",
    avatar: "👨‍🎓",
    streak: 8,
    isOnline: true,
    hoursToday: 2.8,
  },
  {
    name: "Emma Wilson",
    username: "@emmaw",
    status: "studying Mathematics",
    avatar: "👩‍🔬",
    streak: 15,
    isOnline: false,
    hoursToday: 0,
  },
  {
    name: "Jake Thompson",
    username: "@jaket",
    status: "on a 5min break",
    avatar: "👨‍💼",
    streak: 6,
    isOnline: true,
    hoursToday: 1.5,
  },
];

const incomingRequests: FriendRequest[] = [
  {
    id: "1",
    name: "Maya Patel",
    username: "@mayap",
    avatar: "👩‍🎨",
    mutualFriends: 3,
    timestamp: "2h ago",
  },
  {
    id: "2",
    name: "David Lee",
    username: "@davidl",
    avatar: "👨‍🔬",
    mutualFriends: 1,
    timestamp: "1d ago",
  },
];

const outgoingRequests: FriendRequest[] = [
  {
    id: "3",
    name: "Sophie Martin",
    username: "@sophiem",
    avatar: "👩‍💼",
    mutualFriends: 2,
    timestamp: "3d ago",
  },
];

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<
    "friends" | "incoming" | "outgoing"
  >("friends");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchUsername.trim()) return;

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults([
        {
          name: "John Doe",
          username: "@johnd",
          avatar: "👨‍💻",
          mutualFriends: 5,
          isAlreadyFriend: false,
        },
        {
          name: "Lisa Wang",
          username: "@lisaw",
          avatar: "👩‍🔬",
          mutualFriends: 2,
          isAlreadyFriend: false,
        },
      ]);
      setIsSearching(false);
    }, 1000);
  };

  const handleSendRequest = (username: string) => {
    console.log(`Sending friend request to ${username}`);
  };

  const handleAcceptRequest = (id: string) => {
    console.log(`Accepting request ${id}`);
  };

  const handleRejectRequest = (id: string) => {
    console.log(`Rejecting request ${id}`);
  };

  const handleCancelRequest = (id: string) => {
    console.log(`Canceling request ${id}`);
  };

  const TabButton = ({
    tab,
    label,
    count = 0,
  }: {
    tab: "friends" | "incoming" | "outgoing";
    label: string;
    count?: number;
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
      {count > 0 && (
        <Badge variant="secondary" className="ml-2 text-xs">
          {count}
        </Badge>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Friend Button */}
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
      <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "friends" && (
            <>
              {friends.map((friend, index) => (
                <Card
                  key={index}
                  className="border-border bg-card hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="text-3xl">{friend.avatar}</div>
                          {friend.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {friend.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {friend.username}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {friend.status}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline" className="border-border">
                              {friend.hoursToday}h today
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Flame className="w-4 h-4 text-destructive" />
                              <span className="text-sm font-medium text-destructive">
                                {friend.streak}
                              </span>
                            </div>
                          </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {activeTab === "incoming" && (
            <>
              {incomingRequests.map((request) => (
                <Card key={request.id} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{request.avatar}</div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {request.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.mutualFriends} mutual friends •{" "}
                            {request.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
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
                        <div className="text-3xl">{request.avatar}</div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {request.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.mutualFriends} mutual friends • Sent{" "}
                            {request.timestamp}
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
                          onClick={() => handleCancelRequest(request.id)}
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
        </div>

        {/* Live Activity Sidebar */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-card-foreground">
              <Activity className="w-5 h-5" />
              <span>Live Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-card-foreground">
                Sarah started a focus session
              </span>
              <span className="text-muted-foreground">2m ago</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-card-foreground">
                Alex completed 4 pomodoros
              </span>
              <span className="text-muted-foreground">15m ago</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span className="text-card-foreground">Jake took a break</span>
              <span className="text-muted-foreground">23m ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-card-foreground">
                Add Friends
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddFriendModal(false)}
                className="text-muted-foreground hover:text-card-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
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
                  <p className="text-muted-foreground mt-2">Searching...</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {searchResults.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{user.avatar}</div>
                        <div>
                          <h3 className="font-medium text-card-foreground">
                            {user.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.mutualFriends} mutual friends
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.username)}
                        disabled={user.isAlreadyFriend}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {user.isAlreadyFriend ? "Friends" : "Add"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchUsername && !isSearching && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
