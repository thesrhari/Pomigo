"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  MessageCircle,
  Heart,
  Trophy,
  Star,
  Crown,
  Eye,
  Activity,
  Flame,
} from "lucide-react";

interface Friend {
  name: string;
  status: string;
  avatar: string;
  streak: number;
  isOnline: boolean;
  hoursToday: number;
}

interface StudyGroup {
  id: number;
  name: string;
  members: number;
  totalHours: number;
  currentStreak: number;
  isPro: boolean;
}

const friends: Friend[] = [
  {
    name: "Sarah Chen",
    status: "studying Physics",
    avatar: "👩‍💻",
    streak: 12,
    isOnline: true,
    hoursToday: 3.2,
  },
  {
    name: "Alex Kumar",
    status: "completed 4 pomodoros",
    avatar: "👨‍🎓",
    streak: 8,
    isOnline: true,
    hoursToday: 2.8,
  },
  {
    name: "Emma Wilson",
    status: "studying Mathematics",
    avatar: "👩‍🔬",
    streak: 15,
    isOnline: false,
    hoursToday: 0,
  },
  {
    name: "Jake Thompson",
    status: "on a 5min break",
    avatar: "👨‍💼",
    streak: 6,
    isOnline: true,
    hoursToday: 1.5,
  },
];

const studyGroups: StudyGroup[] = [
  {
    id: 1,
    name: "CS Study Group",
    members: 12,
    totalHours: 145,
    currentStreak: 8,
    isPro: false,
  },
  {
    id: 2,
    name: "Medical Students United",
    members: 25,
    totalHours: 280,
    currentStreak: 12,
    isPro: true,
  },
  {
    id: 3,
    name: "Finals Prep Squad",
    members: 8,
    totalHours: 95,
    currentStreak: 5,
    isPro: false,
  },
];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("friends");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Social Hub</h1>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friends
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
        </TabsList>

        {/* --- Friends Tab --- */}
        <TabsContent value="friends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Friends List */}
            <div className="lg:col-span-2 space-y-4">
              {friends.map((friend, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="text-3xl">{friend.avatar}</div>
                          {friend.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{friend.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {friend.status}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge variant="outline">
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
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Live Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Live Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span>Sarah started a focus session</span>
                  <span className="text-muted-foreground">2m ago</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Alex completed 4 pomodoros</span>
                  <span className="text-muted-foreground">15m ago</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span>Jake took a break</span>
                  <span className="text-muted-foreground">23m ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Leaderboards Tab --- */}
        <TabsContent value="leaderboards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Leaders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span>Weekly Leaders</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {friends
                  .sort((a, b) => b.streak - a.streak)
                  .map((friend, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-primary/10 text-primary"
                            : index === 1
                            ? "bg-muted text-muted-foreground"
                            : index === 2
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="text-lg">{friend.avatar}</div>
                      <div className="flex-1">
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {friend.hoursToday}h this week
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Flame className="w-4 h-4 text-destructive" />
                        <span className="font-medium text-destructive">
                          {friend.streak}
                        </span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Global Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-primary" />
                  <span>Global Rankings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">#247</div>
                  <div className="text-sm text-muted-foreground">
                    Your Global Rank
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Top 15% of users!
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Study Hours Rank</span>
                    <Badge>#189</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Streak Rank</span>
                    <Badge>#312</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistency Rank</span>
                    <Badge>#156</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Study Groups Tab --- */}
        <TabsContent value="groups" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {studyGroups.map((group) => (
                <Card key={group.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                          {group.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{group.name}</h3>
                            {group.isPro && (
                              <Crown className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{group.members} members</span>
                            <span>{group.totalHours}h total</span>
                            <div className="flex items-center space-x-1">
                              <Flame className="w-3 h-3 text-destructive" />
                              <span>{group.currentStreak} days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pro Upsell */}
              <Card className="border-2 border-dashed border-primary">
                <CardContent className="p-8 text-center">
                  <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Create Your Own Study Circle
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start a private group with your friends, set shared goals,
                    and achieve them together!
                  </p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Group Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Physics Masters</div>
                    <div className="text-sm text-muted-foreground">
                      15 members • Similar subjects
                    </div>
                    <Button size="sm" className="w-full mt-2">
                      Join
                    </Button>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Early Birds Club</div>
                    <div className="text-sm text-muted-foreground">
                      23 members • Morning studiers
                    </div>
                    <Button size="sm" className="w-full mt-2">
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Group Challenges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <div className="font-medium text-accent-foreground">
                      100 Hour Challenge
                    </div>
                    <div className="text-sm text-accent-foreground/80">
                      Study 100 hours this month
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      23 participants
                    </div>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg">
                    <div className="font-medium text-success">
                      Consistency King
                    </div>
                    <div className="text-sm text-success/80">
                      30-day study streak
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      45 participants
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
