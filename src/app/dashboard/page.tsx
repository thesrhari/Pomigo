"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Play, Timer, Target, Flame, Book, Users } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Mock Data ---
const todayStats = {
  streak: 7,
  hoursToday: 3.2,
  pomodorosToday: 6,
  topSubject: "Mathematics",
};

const weeklyData = [
  { day: "Mon", hours: 4.5 },
  { day: "Tue", hours: 3.2 },
  { day: "Wed", hours: 5.1 },
  { day: "Thu", hours: 2.8 },
  { day: "Fri", hours: 6.2 },
  { day: "Sat", hours: 4.0 },
  { day: "Sun", hours: 3.2 },
];

const friends = [
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
];

// Updated StatCard using CSS tokens
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  variant: "primary" | "secondary" | "accent" | "muted";
}) => {
  const variantStyles = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary-foreground",
    accent: "bg-accent/10 text-accent-foreground",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Updated FriendsActivity using CSS tokens
const FriendsActivity = ({ friends }: { friends: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Friends Activity
      </CardTitle>
      <CardDescription>See what your friends are studying.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {friends.map((friend) => (
          <div key={friend.name} className="flex items-center space-x-3">
            <div className="relative">
              <span className="text-2xl">{friend.avatar}</span>
              {friend.isOnline && (
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-chart-2 ring-2 ring-background" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{friend.name}</p>
              <p className="text-xs text-muted-foreground">{friend.status}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <Card className="bg-muted/50 border-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold">Good morning, Alex! 👋</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Ready for another productive study session?
              </p>
              <div className="flex items-center mt-4 space-x-2">
                <Flame className="w-5 h-5 text-chart-3" />
                <span className="font-semibold text-chart-3">
                  {todayStats.streak} day streak!
                </span>
              </div>
            </div>
            <Button size="lg" onClick={() => router.push("/pomodoro")}>
              <Play className="w-5 h-5 mr-2" />
              Start Pomodoro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Hours Today"
          value={todayStats.hoursToday}
          subtitle="Keep it up!"
          icon={Timer}
          variant="primary"
        />
        <StatCard
          title="Pomodoros"
          value={todayStats.pomodorosToday}
          subtitle="Today's sessions"
          icon={Target}
          variant="secondary"
        />
        <StatCard
          title="Streak"
          value={`${todayStats.streak} days`}
          subtitle="Personal best!"
          icon={Flame}
          variant="accent"
        />
        <StatCard
          title="Top Subject"
          value={todayStats.topSubject}
          subtitle="This week"
          icon={Book}
          variant="muted"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This Week's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "calc(var(--radius) - 2px)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--primary)"
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Friends Activity */}
        <FriendsActivity friends={friends} />
      </div>
    </div>
  );
}
