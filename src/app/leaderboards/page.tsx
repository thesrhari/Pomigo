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

interface Friend {
  name: string;
  status: string;
  avatar: string;
  streak: number;
  isOnline: boolean;
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  dailyBreaks: number;
  weeklyBreaks: number;
  monthlyBreaks: number;
  yearlyBreaks: number;
}

const friends: Friend[] = [
  {
    name: "Maya Patel",
    status: "deep focus mode",
    avatar: "👩‍🎨",
    streak: 22,
    isOnline: true,
    dailyHours: 8.3,
    weeklyHours: 52.8,
    monthlyHours: 218.4,
    yearlyHours: 2620.8,
    dailyBreaks: 0.3,
    weeklyBreaks: 1.9,
    monthlyBreaks: 8.4,
    yearlyBreaks: 100.8,
  },
  {
    name: "Emma Wilson",
    status: "studying Mathematics",
    avatar: "👩‍🔬",
    streak: 15,
    isOnline: false,
    dailyHours: 7.1,
    weeklyHours: 45.3,
    monthlyHours: 189.7,
    yearlyHours: 2276.4,
    dailyBreaks: 0.5,
    weeklyBreaks: 2.8,
    monthlyBreaks: 12.1,
    yearlyBreaks: 145.2,
  },
  {
    name: "Sarah Chen",
    status: "studying Physics",
    avatar: "👩‍💻",
    streak: 12,
    isOnline: true,
    dailyHours: 6.2,
    weeklyHours: 38.4,
    monthlyHours: 156.8,
    yearlyHours: 1845.2,
    dailyBreaks: 0.8,
    weeklyBreaks: 4.2,
    monthlyBreaks: 18.6,
    yearlyBreaks: 224.3,
  },
  {
    name: "Alex Kumar",
    status: "completed 4 pomodoros",
    avatar: "👨‍🎓",
    streak: 8,
    isOnline: true,
    dailyHours: 4.8,
    weeklyHours: 32.1,
    monthlyHours: 128.4,
    yearlyHours: 1540.8,
    dailyBreaks: 1.2,
    weeklyBreaks: 6.8,
    monthlyBreaks: 27.4,
    yearlyBreaks: 328.8,
  },
  {
    name: "Jake Thompson",
    status: "on a 5min break",
    avatar: "👨‍💼",
    streak: 6,
    isOnline: true,
    dailyHours: 3.5,
    weeklyHours: 24.7,
    monthlyHours: 98.6,
    yearlyHours: 1183.2,
    dailyBreaks: 2.1,
    weeklyBreaks: 12.4,
    monthlyBreaks: 48.6,
    yearlyBreaks: 583.2,
  },
  {
    name: "Ryan Lee",
    status: "break champion",
    avatar: "👨‍🍳",
    streak: 3,
    isOnline: true,
    dailyHours: 2.1,
    weeklyHours: 14.2,
    monthlyHours: 56.8,
    yearlyHours: 681.6,
    dailyBreaks: 3.8,
    weeklyBreaks: 24.6,
    monthlyBreaks: 98.4,
    yearlyBreaks: 1180.8,
  },
];

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
    label: "Study Leaders",
    icon: <Brain className="w-3 h-3" />,
  },
  {
    value: "leastStudied",
    label: "Chill Masters",
    icon: <Coffee className="w-3 h-3" />,
  },
  {
    value: "mostBreaks",
    label: "Break Champions",
    icon: <Coffee className="w-3 h-3" />,
  },
  {
    value: "leastBreaks",
    label: "Focus Machines",
    icon: <Zap className="w-3 h-3" />,
  },
];

export default function MinimalLeaderboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");
  const [metricType, setMetricType] = useState<MetricType>("mostStudied");

  const getMetricValue = (
    friend: Friend,
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

  const sortedFriends = [...friends].sort((a, b) => {
    const aValue = getMetricValue(a, timePeriod, metricType);
    const bValue = getMetricValue(b, timePeriod, metricType);

    if (metricType === "leastStudied" || metricType === "leastBreaks") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const currentMetric = metricTypes.find((m) => m.value === metricType)!;
  const isBreakMetric =
    metricType === "mostBreaks" || metricType === "leastBreaks";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm">
            {sortedFriends.length} friends competing
          </p>
        </div>

        {/* Compact Filters */}
        <div className="bg-card/80 border border-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Period Filter */}
            <div className="flex-1">
              <div className="flex rounded-md bg-muted/50 p-1">
                {timePeriods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setTimePeriod(period.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      timePeriod === period.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {period.icon}
                    <span>{period.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Type Filter */}
            <div className="flex-1">
              <div className="flex rounded-md bg-muted/50 p-1">
                {metricTypes.map((metric) => (
                  <button
                    key={metric.value}
                    onClick={() => setMetricType(metric.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      metricType === metric.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {metric.icon}
                    <span className="hidden sm:inline">{metric.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {sortedFriends.map((friend, index) => {
            const value = getMetricValue(friend, timePeriod, metricType);
            const isTop3 = index < 3;

            return (
              <div
                key={friend.name}
                className={`bg-card border border-border rounded-lg p-4 transition-all hover:shadow-sm ${
                  isTop3 ? "bg-primary/5 border-primary/20" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {index === 0 && <Crown className="w-5 h-5 text-primary" />}
                    {index === 1 && (
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                    )}
                    {index === 2 && (
                      <Star className="w-4 h-4 text-muted-foreground" />
                    )}
                    {index > 2 && (
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar & Status Indicator */}
                  <div className="flex-shrink-0 relative">
                    <span className="text-2xl">{friend.avatar}</span>
                    {friend.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border border-background rounded-full"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {friend.name}
                      </h3>
                      {isTop3 && (
                        <span className="inline-block bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs font-medium">
                          Top {index + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {friend.status}
                    </p>
                    {!isBreakMetric && friend.streak > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Flame className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {friend.streak} day streak
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
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

        {/* Your Position Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <h3 className="text-center text-lg font-semibold mb-4">
            Your Position
          </h3>
          <div className="text-center space-y-2">
            <Trophy className="w-8 h-8 text-primary mx-auto" />
            <div className="text-2xl font-bold text-foreground">#247</div>
            <span className="inline-block bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded text-sm font-medium">
              Top 15%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
