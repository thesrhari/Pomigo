"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Filter,
  Timer,
  Target,
  TrendingUp,
  Flame,
  Award,
  Coffee,
  Moon,
  Brain,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

// Mock data remains the same
const weeklyData = [
  { day: "Mon", hours: 4.5, pomodoros: 9, breaks: 8, productivity: 85 },
  { day: "Tue", hours: 3.2, pomodoros: 6, breaks: 5, productivity: 78 },
  { day: "Wed", hours: 5.1, pomodoros: 10, breaks: 9, productivity: 92 },
  { day: "Thu", hours: 2.8, pomodoros: 5, breaks: 4, productivity: 70 },
  { day: "Fri", hours: 6.2, pomodoros: 12, breaks: 11, productivity: 95 },
  { day: "Sat", hours: 4.0, pomodoros: 8, breaks: 7, productivity: 88 },
  { day: "Sun", hours: 3.2, pomodoros: 6, breaks: 5, productivity: 82 },
];

const subjectData = [
  { name: "Mathematics", value: 35, color: "var(--primary)", hours: 15.2 },
  { name: "Physics", value: 25, color: "var(--secondary)", hours: 10.8 },
  { name: "Chemistry", value: 20, color: "var(--accent)", hours: 8.6 },
  { name: "Biology", value: 20, color: "var(--destructive)", hours: 8.6 },
];

// Refactored StatCard using shadcn/ui Card and Tailwind theme tokens
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: "info" | "success" | "accent" | "warning";
}) => {
  const colorVariants = {
    info: {
      bg: "bg-primary/10",
      text: "text-primary",
    },
    success: {
      bg: "bg-secondary/10",
      text: "text-secondary",
    },
    accent: {
      bg: "bg-accent/10",
      text: "text-accent",
    },
    warning: {
      bg: "bg-destructive/10",
      text: "text-destructive",
    },
  };

  const { bg, text } = colorVariants[color];

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
          <div className={`p-3 rounded-lg ${bg}`}>
            <Icon className={`w-6 h-6 ${text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState("week");
  const [totalTime, setTotalTime] = useState(0);
  const [totalCompletedSession, setTotalCompletedSession] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          console.error(error);
          return;
        }

        if (data && data.length > 0) {
          setTotalTime(data[0].total_study_time);
          setTotalCompletedSession(data[0].total_completed_sessions);
        }
      }
    };
    fetchStats();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Study Time"
          value={
            totalTime >= 60
              ? `${(totalTime / 60).toFixed(1)}h`
              : `${totalTime} min`
          }
          subtitle="This month"
          icon={Timer}
          color="info"
        />
        <StatCard
          title="Focus Sessions"
          value={`${totalCompletedSession}`}
          subtitle="Completed"
          icon={Target}
          color="success"
        />
        <StatCard
          title="Productivity Score"
          value="87%"
          subtitle="Above average"
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          title="Current Streak"
          value="7 days"
          subtitle="Personal best!"
          icon={Flame}
          color="warning"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Study Hours Trend</CardTitle>
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="day"
                    className="fill-muted-foreground text-xs"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="fill-muted-foreground text-xs"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius)",
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

        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {subjectData.map((subject, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {subject.name}
                  </span>
                  <span className="text-sm font-medium">{subject.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Productivity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="day"
                    className="fill-muted-foreground text-xs"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="fill-muted-foreground text-xs"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="productivity"
                    stroke="var(--primary)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Average Session Length
                </span>
                <span className="font-medium">28.5 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longest Session</span>
                <span className="font-medium">65 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Most Productive Hour
                </span>
                <span className="font-medium">2-3 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Favorite Break Length
                </span>
                <span className="font-medium">5 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Focus Time</span>
                  <span>68%</span>
                </div>
                <Progress value={68} className="h-2 [&>div]:bg-primary" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Break Time</span>
                  <span>25%</span>
                </div>
                <Progress value={25} className="h-2 [&>div]:bg-secondary" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">
                    Distraction Time
                  </span>
                  <span>7%</span>
                </div>
                <Progress value={7} className="h-2 [&>div]:bg-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
