"use client";
import React, { useState } from "react";
import {
  Trophy,
  Star,
  Flame,
  Clock,
  Coffee,
  Brain,
  Zap,
  Calendar,
  Target,
  Crown,
  Award,
} from "lucide-react";
import {
  useLeaderboardData,
  LeaderboardFriend,
} from "@/lib/hooks/useLeaderboardData";
import { LeaderboardSkeleton } from "./components/LeaderboardSkeleton";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";
type MetricType = "mostStudied" | "leastStudied" | "mostBreaks" | "leastBreaks";

const timePeriods: {
  value: TimePeriod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "daily", label: "Day", icon: <Clock className="w-3 h-3" /> },
  { value: "weekly", label: "Week", icon: <Calendar className="w-3 h-3" /> },
  { value: "monthly", label: "Month", icon: <Target className="w-3 h-3" /> },
  { value: "yearly", label: "Year", icon: <Award className="w-3 h-3" /> },
];

const metricTypes: {
  value: MetricType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "mostStudied",
    label: "Nerd",
    icon: <Brain className="w-3 h-3" />,
  },
  {
    value: "leastStudied",
    label: "Procrastinator",
    icon: <Coffee className="w-3 h-3" />,
  },
  {
    value: "mostBreaks",
    label: "Slacker",
    icon: <Coffee className="w-3 h-3" />,
  },
  {
    value: "leastBreaks",
    label: "Hustler",
    icon: <Zap className="w-3 h-3" />,
  },
];

// --- NEW: Object to hold the descriptions for each metric type ---
const metricDescriptions: Record<MetricType, string> = {
  mostStudied: "Most Time Studied",
  leastStudied: "Least Time Studied",
  mostBreaks: "Most Time Spent on Breaks",
  leastBreaks: "Least Time Spent on Breaks",
};

export default function MinimalLeaderboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");
  const [metricType, setMetricType] = useState<MetricType>("mostStudied");
  const { friends, currentUserData, loading, error } = useLeaderboardData();

  const getMetricValue = (
    friend: LeaderboardFriend,
    period: TimePeriod,
    type: MetricType
  ): number => {
    if (type === "mostStudied" || type === "leastStudied") {
      switch (period) {
        case "daily":
          return friend.dailyHours;
        case "weekly":
          return friend.weeklyHours;
        case "monthly":
          return friend.monthlyHours;
        case "yearly":
          return friend.yearlyHours;
      }
    } else {
      switch (period) {
        case "daily":
          return friend.dailyBreaks;
        case "weekly":
          return friend.weeklyBreaks;
        case "monthly":
          return friend.monthlyBreaks;
        case "yearly":
          return friend.yearlyBreaks;
      }
    }
  };

  const allUsersForRanking = currentUserData
    ? [...friends, currentUserData]
    : [...friends];
  const sortedUsers = [...allUsersForRanking].sort((a, b) => {
    const aValue = getMetricValue(a, timePeriod, metricType);
    const bValue = getMetricValue(b, timePeriod, metricType);
    if (metricType === "leastStudied" || metricType === "leastBreaks") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const currentUserRank = currentUserData
    ? sortedUsers.findIndex((u) => u.id === currentUserData.id) + 1
    : null;
  const totalRankedUsers = sortedUsers.length;
  const currentUserPercentage =
    totalRankedUsers > 0 && currentUserRank
      ? (currentUserRank / totalRankedUsers) * 100
      : 0;

  // --- MODIFIED SECTION ---
  // Display the skeleton component while loading
  if (loading) {
    return <LeaderboardSkeleton />;
  }
  // --- END OF MODIFIED SECTION ---

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 flex justify-center items-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const isBreakMetric =
    metricType === "mostBreaks" || metricType === "leastBreaks";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm">
            {friends.length > 0
              ? `${friends.length + 1} people competing`
              : "Compete with your friends"}
          </p>
        </div>
        <div className="bg-card/80 border border-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex rounded-md bg-muted/50 p-1 gap-1">
                {timePeriods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setTimePeriod(period.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      timePeriod === period.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                    }`}
                  >
                    {period.icon}
                    <span>{period.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex rounded-md bg-muted/50 p-1 gap-1">
                {metricTypes.map((metric) => (
                  <button
                    key={metric.value}
                    onClick={() => setMetricType(metric.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      metricType === metric.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                    }`}
                  >
                    {metric.icon}
                    <span className="hidden sm:inline">{metric.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* --- NEW: Display the description for the selected metric --- */}
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">
              Showing:{" "}
              <span className="font-semibold">
                {metricDescriptions[metricType]}
              </span>
            </p>
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4 flex flex-col items-center">
            <Trophy className="w-12 h-12 text-yellow-500/80 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground">
              Start a Friendly Competition!
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Invite friends to see how you stack up. A little competition makes
              studying more fun.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* --- FIX 1: Render all users including the current one --- */}
            {sortedUsers.map((user, index) => {
              const value = getMetricValue(user, timePeriod, metricType);
              const isTop3 = index < 3;
              const isCurrentUser = user.id === currentUserData?.id;

              return (
                <div
                  key={user.id}
                  className={`bg-card border rounded-lg p-4 transition-all hover:shadow-sm ${
                    isCurrentUser
                      ? "border-primary bg-primary/5"
                      : isTop3
                      ? "border-border"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {index === 0 && (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      )}
                      {index === 1 && (
                        <Trophy className="w-4 h-4 text-slate-400" />
                      )}
                      {index === 2 && (
                        <Star className="w-4 h-4 text-orange-400" />
                      )}
                      {index > 2 && (
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0 relative">
                      <Avatar className="h-10 w-10 cursor-pointer select-none">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.display_name || "User avatar"}
                            width={64}
                            height={64}
                            className="rounded-full"
                          />
                        ) : (
                          <AvatarFallback>
                            {user.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {isCurrentUser ? "You" : user.display_name}
                        </h3>
                        {isTop3 && (
                          <span className="inline-block bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs font-medium">
                            Top {index + 1}
                          </span>
                        )}
                      </div>
                      {!isBreakMetric && user.streak > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Flame className="w-3 h-3 text-primary" />
                          <span className="text-xs text-primary font-medium">
                            {user.streak} day streak
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-foreground">
                        {value.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        hours {isBreakMetric ? "breaks" : "studied"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* This card is now optional but can be kept as a quick summary */}
        {currentUserData && currentUserRank && sortedUsers.length > 1 && (
          <div className="bg-card border border-border rounded-lg p-6 sticky bottom-4 shadow-lg">
            <h3 className="text-center text-sm font-semibold mb-3 text-muted-foreground">
              Your Summary
            </h3>
            <div className="flex justify-around items-center text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  #{currentUserRank}
                </div>
                <div className="text-xs text-muted-foreground">Rank</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.ceil(currentUserPercentage)}%
                </div>
                <div className="text-xs text-muted-foreground">Percentile</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {getMetricValue(
                    currentUserData,
                    timePeriod,
                    metricType
                  ).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
