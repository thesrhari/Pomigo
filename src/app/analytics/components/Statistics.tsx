// components/Statistics.tsx
"use client";

import {
  Brain,
  Target,
  Clock,
  Timer,
  Coffee,
  Award,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "../components/StatCard";
import { formatMinutes } from "@/utils/client/formatMinutes";

interface StudyStatsGridProps {
  totalStudyTime: number;
  totalStudySessions: number;
  averageSessionLength: number;
}

interface SubjectDistributionChartProps {
  totalTimePerSubject: { name: string; value: number; color: string }[];
}

interface BreakdownCardProps {
  totalStudyTime: number;
  totalBreakTime: number;
  totalShortBreakTime: number;
  totalLongBreakTime: number;
}

export const StudyStatsGrid = ({
  totalStudyTime,
  totalStudySessions,
  averageSessionLength,
}: StudyStatsGridProps) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    <StatCard
      title="Total Study Time"
      value={formatMinutes(totalStudyTime)}
      icon={Brain}
      color="--primary"
    />
    <StatCard
      title="Focus Sessions"
      value={totalStudySessions.toString()}
      icon={Target}
      color="--chart-2"
    />
    <StatCard
      title="Avg. Session Length"
      value={formatMinutes(averageSessionLength)}
      icon={Clock}
      color="--chart-4"
    />
  </div>
);

export const SubjectDistributionChart = ({
  totalTimePerSubject,
}: SubjectDistributionChartProps) => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle>Subject Distribution</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-80 w-full">
        {totalTimePerSubject.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={totalTimePerSubject}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
              >
                {totalTimePerSubject.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: number) => formatMinutes(value)}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
                itemStyle={{
                  color: "var(--foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No study data for this period.
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export const BreakdownCard = ({
  totalStudyTime,
  totalBreakTime,
  totalShortBreakTime,
  totalLongBreakTime,
}: BreakdownCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Breakdown</CardTitle>
    </CardHeader>
    <CardContent className="flex h-full flex-col justify-between pt-4">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center text-muted-foreground">
            <Timer className="mr-2 h-4 w-4" /> Total Break Time
          </span>
          <span className="font-medium">{formatMinutes(totalBreakTime)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-muted-foreground">
            <Coffee className="mr-2 h-4 w-4" /> Short Breaks
          </span>
          <span className="font-medium">
            {formatMinutes(totalShortBreakTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-muted-foreground">
            <Award className="mr-2 h-4 w-4" /> Long Breaks
          </span>
          <span className="font-medium">
            {formatMinutes(totalLongBreakTime)}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center text-sm font-medium text-muted-foreground">
          <PieChartIcon className="mr-2 h-4 w-4" /> Study vs. Break Ratio
        </div>
        {totalStudyTime + totalBreakTime > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={[
                  { name: "Study", value: totalStudyTime },
                  { name: "Break", value: totalBreakTime },
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={50}
              >
                <Cell fill="var(--primary)" />
                <Cell fill="var(--popover-foreground)" />
              </Pie>
              <RechartsTooltip
                formatter={(value: number) => formatMinutes(value)}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
                itemStyle={{
                  color: "var(--foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">
            No activity to display.
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
