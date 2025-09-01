// app/analytics/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalyticsData, TimeFilter } from "@/lib/hooks/useAnalyticsData";
import {
  Loader2,
  Filter,
  Timer,
  Target,
  Flame,
  Award,
  Coffee,
  Brain,
  PieChart as PieChartIcon,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  format,
  startOfWeek,
  eachDayOfInterval,
  getYear,
  endOfWeek,
} from "date-fns";
import { useState } from "react";

// Helper to format minutes into a more readable string like "1h 30m" or "45m"
const formatMinutes = (minutes: number) => {
  if (minutes < 1) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
};

// A reusable card for displaying key stats
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `hsla(var(${color}-hsl), 0.1)` }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: `hsl(var(${color}-hsl))` }}
          />
        </div>
      </div>
    </CardContent>
  </Card>
);

// 2. Create a new, separate component for our Fun Fact card
const FunFactCard = ({
  title,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) => (
  <Card className="flex flex-col justify-center items-center text-center p-6 h-full">
    <div
      className="p-4 rounded-full mb-4"
      style={{ backgroundColor: `hsla(var(${color}-hsl), 0.1)` }}
    >
      <Icon className="w-8 h-8" style={{ color: `hsl(var(${color}-hsl))` }} />
    </div>
    <p className="text-xl font-bold">{title}</p>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </Card>
);

const PlaceholderCard = () => (
  <Card className="flex flex-col justify-center items-center text-center p-6 h-full border-dashed">
    <div className="p-4 rounded-full mb-4 bg-muted">
      <Sparkles className="w-8 h-8 text-muted-foreground" />
    </div>
    <p className="text-xl font-bold">Discover Your Persona</p>
    <p className="text-sm text-muted-foreground mt-1">
      Complete more study sessions to unlock this fun stat!
    </p>
  </Card>
);

const ContributionGraph = ({
  data,
  year,
}: {
  data: { date: string; count: number }[];
  year: number;
}) => {
  const today = new Date();
  const dataMap = new Map(data.map((item) => [item.date, item.count]));

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;

  const getColor = (count: number) => {
    if (count <= 0) return "var(--border)";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.75) return "var(--chart-1)";
    if (intensity > 0.5) return "var(--chart-2)";
    if (intensity > 0.25) return "var(--chart-3)";
    return "var(--chart-4)";
  };

  const startDate = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 });
  const endDate = endOfWeek(new Date(year, 11, 31), { weekStartsOn: 1 });
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  const monthPositions = weeks.reduce((acc, week, colIndex) => {
    const firstDayOfMonth = week.find((day) => day.getDate() === 1);
    if (firstDayOfMonth) {
      acc.push({
        month: format(firstDayOfMonth, "MMM"),
        colIndex,
      });
    }
    return acc;
  }, [] as { month: string; colIndex: number }[]);

  const CUBE_SIZE = 10;
  const CUBE_GAP = 3;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full overflow-x-auto">
        <div className="flex">
          <div
            className="flex flex-col text-xs text-muted-foreground pr-3 pt-5"
            style={{ gap: `${CUBE_GAP}px` }}
          >
            <div className="h-2.5 flex items-center">Mon</div>
            <div className="h-2.5" />
            <div className="h-2.5 flex items-center">Wed</div>
            <div className="h-2.5" />
            <div className="h-2.5 flex items-center">Fri</div>
          </div>
          <div className="flex flex-col">
            <div className="relative h-5">
              {monthPositions.map(({ month, colIndex }) => (
                <span
                  key={`${month}-${colIndex}`}
                  className="absolute text-xs text-muted-foreground"
                  style={{ left: `${colIndex * (CUBE_SIZE + CUBE_GAP)}px` }}
                >
                  {month}
                </span>
              ))}
            </div>
            <div className="flex" style={{ gap: `${CUBE_GAP}px` }}>
              <TooltipProvider>
                {weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="flex flex-col"
                    style={{ gap: `${CUBE_GAP}px` }}
                  >
                    {week.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const count = dataMap.get(dateStr) || 0;
                      return (
                        <Tooltip key={dateStr} delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  day > today || getYear(day) !== year
                                    ? "transparent"
                                    : getColor(count),
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {count > 0
                                ? formatMinutes(count)
                                : "No study activity"}{" "}
                              on {format(day, "MMM d, yyyy")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end items-center text-xs text-muted-foreground mt-2 gap-2 w-full">
        <span>Less</span>
        <div className="flex gap-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--border)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-4)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-3)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-2)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-1)" }}
          />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState<TimeFilter>("week");
  const [contributionYear, setContributionYear] = useState<number>(
    new Date().getFullYear()
  );
  const { data, loading, error, availableYears } = useAnalyticsData(
    dateFilter,
    contributionYear
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-destructive p-8">
        <h2 className="text-xl font-semibold">Could not load data</h2>
        <p>{error || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const {
    totalStudyTime,
    totalStudySessions,
    totalBreakTime,
    totalTimePerSubject,
    currentStreak,
    bestStreak,
    contributionData,
    totalContributionTimeForYear,
    funFact, // 3. Destructure the new funFact data
  } = data;

  // 4. Prepare the content for the fun fact card
  const funFactContent = funFact
    ? {
        title: funFact.isEarlyBird ? "Early Bird" : "Night Owl",
        description: `You're most productive around ${
          funFact.hour % 12 === 0 ? 12 : funFact.hour % 12
        }${funFact.hour < 12 ? "am" : "pm"}!`,
        icon: funFact.isEarlyBird ? Sun : Moon,
        color: funFact.isEarlyBird ? "--chart-3" : "--chart-5",
      }
    : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as TimeFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          title="Current Streak"
          value={`${currentStreak} days`}
          icon={Flame}
          color="--chart-5"
        />
        <StatCard
          title="Best Streak"
          value={`${bestStreak} days`}
          icon={Award}
          color="--chart-3"
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
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
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
                  {formatMinutes(data.totalShortBreakTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center">
                  <Award className="w-4 h-4 mr-2" /> Long Breaks
                </span>
                <span className="font-medium">
                  {formatMinutes(data.totalLongBreakTime)}
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
                      <Cell fill="var(--primary)" />
                      <Cell fill="var(--secondary)" />
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatMinutes(value)}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
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

      <div className="border-t" />

      {/* 5. Update the layout for the activity and fun fact section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Your Study Activity</CardTitle>
              <p className="text-sm text-muted-foreground pt-1">
                {formatMinutes(totalContributionTimeForYear)} studied in{" "}
                {contributionYear}
              </p>
            </div>
            {availableYears.length > 0 && (
              <Select
                value={contributionYear.toString()}
                onValueChange={(value) => setContributionYear(parseInt(value))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent>
            <ContributionGraph
              data={contributionData}
              year={contributionYear}
            />
          </CardContent>
        </Card>

        {/* The new FunFactCard will render here beside the graph */}
        {funFactContent ? (
          <FunFactCard
            title={funFactContent.title}
            description={funFactContent.description}
            icon={funFactContent.icon}
            color={funFactContent.color}
          />
        ) : (
          <PlaceholderCard />
        )}
      </div>
    </div>
  );
}
