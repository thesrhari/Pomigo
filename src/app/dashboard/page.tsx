"use client";

import React, { useEffect, useState } from "react";
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
import { useAnalyticsData } from "@/lib/hooks/useAnalyticsData";
import { createClient } from "@/lib/supabase/client";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// --- Helper Functions & Components ---

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

// FriendsActivity remains with mock data as the hook doesn't provide this information.
const friends = [
  {
    name: "Sarah Chen",
    status: "studying Physics",
    avatar: "👩‍💻",
    isOnline: true,
  },
  {
    name: "Alex Kumar",
    status: "completed 4 pomodoros",
    avatar: "👨‍🎓",
    isOnline: true,
  },
  {
    name: "Emma Wilson",
    status: "studying Mathematics",
    avatar: "👩‍🔬",
    isOnline: false,
  },
];

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

// --- Main Dashboard Component ---

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<
    { day: string; hours: number }[]
  >([]);

  const {
    data,
    loading: statsLoading,
    error: statsError,
  } = useAnalyticsData("today", new Date().getFullYear());

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.full_name || "there");
    };

    const fetchWeeklyChartData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
      const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });

      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("started_at, duration")
        .eq("user_id", user.id)
        .eq("session_type", "study")
        .gte("started_at", startOfThisWeek.toISOString())
        .lte("started_at", endOfThisWeek.toISOString());

      if (error) {
        console.error("Error fetching weekly data:", error);
        return;
      }

      const daysInWeek = eachDayOfInterval({
        start: startOfThisWeek,
        end: endOfThisWeek,
      });

      const dailyMinutes = new Map<string, number>();
      daysInWeek.forEach((day) => {
        dailyMinutes.set(format(day, "yyyy-MM-dd"), 0);
      });

      sessions.forEach((session) => {
        const dayKey = format(parseISO(session.started_at), "yyyy-MM-dd");
        if (dailyMinutes.has(dayKey)) {
          dailyMinutes.set(
            dayKey,
            dailyMinutes.get(dayKey)! + session.duration
          );
        }
      });

      const chartData = Array.from(dailyMinutes.entries()).map(
        ([date, totalMinutes]) => ({
          day: format(parseISO(date), "E"), // Format to 'Mon', 'Tue', etc.
          // Correctly convert minutes to hours
          hours: parseFloat((totalMinutes / 60).toFixed(1)),
        })
      );

      setWeeklyData(chartData);
    };

    fetchUserData();
    fetchWeeklyChartData();
  }, []);

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError) {
    return (
      <div className="text-red-500">
        Error loading dashboard stats: {statsError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <Card className="bg-muted/50 border-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold">
                Good morning, {userName}! 👋
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Ready for another productive study session?
              </p>
              {data && data.currentStreak > 0 && (
                <div className="flex items-center mt-4 space-x-2">
                  <Flame className="w-5 h-5 text-chart-3" />
                  <span className="font-semibold text-chart-3">
                    {data.currentStreak} day streak!
                  </span>
                </div>
              )}
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
          // Correctly convert minutes to hours
          value={data ? (data.totalStudyTime / 60).toFixed(1) : "0.0"}
          subtitle="Keep it up!"
          icon={Timer}
          variant="primary"
        />
        <StatCard
          title="Pomodoros"
          value={data ? data.totalStudySessions : 0}
          subtitle="Today's sessions"
          icon={Target}
          variant="secondary"
        />
        <StatCard
          title="Streak"
          value={`${data ? data.currentStreak : 0} days`}
          subtitle={`Best: ${data ? data.bestStreak : 0} days`}
          icon={Flame}
          variant="accent"
        />
        <StatCard
          title="Top Subject"
          value={data?.totalTimePerSubject[0]?.name || "N/A"}
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
            <CardTitle>This Week&apos;s Progress</CardTitle>
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

// A skeleton loader component to show while data is fetching
const DashboardSkeleton = () => (
  <div className="space-y-8">
    <Card className="bg-muted/50 border-primary/20">
      <CardContent className="p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-6 w-80 mt-3" />
          </div>
          <Skeleton className="h-12 w-44" />
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-9 w-16 mt-2" />
                <Skeleton className="h-5 w-20 mt-2" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
