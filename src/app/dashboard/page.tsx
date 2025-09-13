"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Timer, Target, Flame, Book } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { StatCard } from "./components/StatCard";
import { FriendsActivity } from "../../components/features/FriendsActivity";
import { useDashboard } from "@/lib/hooks/useDashboard";

const formatDuration = (minutes: number) => {
  // Handle cases where the input is 0 or not a valid number
  if (!minutes || minutes < 0) {
    return "0min";
  }

  // Calculate the whole number of hours
  const hours = Math.floor(minutes / 60);

  // Calculate the remaining minutes using the modulo operator
  const remainingMinutes = minutes % 60;

  // Build the formatted string
  const hoursString = hours > 0 ? `${hours}hr` : "";
  const minutesString = remainingMinutes > 0 ? `${remainingMinutes}min` : "";

  // Join the parts with a space, ensuring no leading/trailing spaces
  return [hoursString, minutesString].filter(Boolean).join(" ");
};

export default function DashboardPage() {
  const router = useRouter();
  const { userName, weeklyData, statsData, statsLoading, statsError } =
    useDashboard();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError) {
    return (
      <div className="text-red-500">
        Error loading dashboard stats: {`${statsError}`}
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
                {greeting}, {userName}! 👋
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Ready for another productive study session?
              </p>
              {statsData && statsData.currentStreak > 0 && (
                <div className="flex items-center mt-4 space-x-2">
                  <Flame className="w-5 h-5 text-chart-3" />
                  <span className="font-semibold text-chart-3">
                    {statsData.currentStreak} day streak!
                  </span>
                </div>
              )}
            </div>
            <Button
              size="lg"
              className="cursor-pointer"
              onClick={() => router.push("/study")}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Pomodoro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Time Today"
          value={statsData ? formatDuration(statsData.totalStudyTime) : "0.0"}
          subtitle={
            statsData
              ? formatDuration(statsData.totalStudyTime) !== "0min"
                ? "Keep it up!"
                : "Time to study!"
              : "Keep it up!"
          }
          icon={Timer}
          variant="primary"
        />
        <StatCard
          title="Pomodoros"
          value={statsData ? statsData.totalStudySessions : 0}
          subtitle="Today's sessions"
          icon={Target}
          variant="secondary"
        />
        <StatCard
          title="Streak"
          value={`${statsData ? statsData.currentStreak : 0} days`}
          subtitle={`Best: ${statsData ? statsData.bestStreak : 0} days`}
          icon={Flame}
          variant="accent"
        />
        <StatCard
          title="Top Subject"
          value={statsData?.totalTimePerSubject[0]?.name || "N/A"}
          subtitle="Today"
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
        <FriendsActivity />
      </div>
    </div>
  );
}
