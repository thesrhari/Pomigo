"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "../components/StatCard";
import {
  Brain,
  Target,
  Clock,
  Timer,
  Coffee,
  Award,
  PieChart as PieChartIcon,
} from "lucide-react";
import { formatMinutes } from "@/utils/client/formatMinutes";

// Define a more specific type for your data if possible
interface FilterableContentProps {
  data: {
    totalStudyTime: number;
    totalStudySessions: number;
    averageSessionLength: number;
    totalTimePerSubject: { name: string; value: number; color: string }[];
    totalBreakTime: number;
    totalShortBreakTime: number;
    totalLongBreakTime: number;
  };
}

export const FilterableContent = ({ data }: FilterableContentProps) => {
  const {
    totalStudyTime,
    totalStudySessions,
    averageSessionLength,
    totalTimePerSubject,
    totalBreakTime,
    totalShortBreakTime,
    totalLongBreakTime,
  } = data;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                      }}
                      itemStyle={{
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No study data for this period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-full pt-4">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center">
                  <Timer className="w-4 h-4 mr-2" /> Total Break Time
                </span>
                <span className="font-medium">
                  {formatMinutes(totalBreakTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center">
                  <Coffee className="w-4 h-4 mr-2" /> Short Breaks
                </span>
                <span className="font-medium">
                  {formatMinutes(totalShortBreakTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center">
                  <Award className="w-4 h-4 mr-2" /> Long Breaks
                </span>
                <span className="font-medium">
                  {formatMinutes(totalLongBreakTime)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <PieChartIcon className="w-4 h-4 mr-2" /> Study vs. Break Ratio
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
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--secondary))" />
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatMinutes(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                      }}
                      itemStyle={{
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground">
                  No activity to display.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
