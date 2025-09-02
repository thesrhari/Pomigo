"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalyticsData, TimeFilter } from "@/lib/hooks/useAnalyticsData";
import {
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
  CalendarCheck,
  BookOpenCheck,
  Trophy,
  Zap,
  Clock,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import { StatCard } from "./components/StatCard";
import { PersonaCard } from "./components/PersonaCard";
import { PlaceholderCard } from "./components/PlaceholderCard";
import { ContributionGraph } from "./components/ContributionGraph";
import { FunStatsData } from "@/lib/hooks/useAnalyticsData";
// --- NEW ---
import { AnalyticsPageSkeleton } from "./components/AnalyticsPageSkeleton";

// ... (rest of the helper functions: formatMinutes, formatHour)

const formatMinutes = (minutes: number) => {
  if (minutes < 1) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
};

const formatHour = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${h}${ampm}`;
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

  // --- MODIFIED LOADING STATE ---
  if (loading) {
    return <AnalyticsPageSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="text-center text-destructive p-8">
        <h2 className="text-xl font-semibold">Could not load data</h2>
        <p>{error || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const { productiveHours, funStats } = data;

  const personaContent = productiveHours
    ? {
        title: productiveHours.isEarlyBird ? "Early Bird" : "Night Owl",
        description: `You're most productive between ${formatHour(
          productiveHours.start
        )} and ${formatHour(productiveHours.end)}!`,
        icon: productiveHours.isEarlyBird ? Sun : Moon,
      }
    : null;

  return (
    // ... (rest of the component remains unchanged)
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Your study habits, visualized.
          </p>
        </div>
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

      {/* --- FILTERABLE SECTION --- */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <FilterableContent data={data} />
        </CardContent>
      </Card>

      {/* --- INSIGHTS & ACTIVITY SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContributionSection
            contributionData={data.contributionData}
            totalContributionTimeForYear={data.totalContributionTimeForYear}
            contributionYear={contributionYear}
            setContributionYear={setContributionYear}
            availableYears={availableYears}
          />
          <FunStatsSection funStats={funStats} />
        </div>

        <div className="space-y-6">
          <StreakSection
            currentStreak={data.currentStreak}
            bestStreak={data.bestStreak}
          />
          {personaContent ? (
            <PersonaCard
              title={personaContent.title}
              description={personaContent.description}
              icon={personaContent.icon}
            />
          ) : (
            <PlaceholderCard message="Study more to unlock your productivity persona!" />
          )}
        </div>
      </div>
    </div>
  );
}

// ... (All sub-components like FilterableContent, FunStatsSection, etc., remain unchanged)
const FilterableContent = ({
  data,
}: {
  data: NonNullable<ReturnType<typeof useAnalyticsData>["data"]>;
}) => {
  const {
    totalStudyTime,
    totalStudySessions,
    averageSessionLength,
    previousPeriodData,
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
          comparisonValue={previousPeriodData?.totalStudyTime}
          numericValue={totalStudyTime}
        />
        <StatCard
          title="Focus Sessions"
          value={totalStudySessions.toString()}
          icon={Target}
          color="--chart-2"
          comparisonValue={previousPeriodData?.totalStudySessions}
          numericValue={totalStudySessions}
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
    </>
  );
};

const FunStatsSection = ({ funStats }: { funStats: FunStatsData | null }) => {
  if (!funStats) {
    return (
      <PlaceholderCard
        title="Insights Locked"
        message="More study data is needed to reveal your habits."
      />
    );
  }

  const { powerHour, mostProductiveDay, subjectDeepDive } = funStats;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deeper Insights</CardTitle>
        <CardDescription>
          All-time stats about your unique study patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center font-semibold mb-2">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" /> Power Hour
          </div>
          {powerHour ? (
            <p>
              Your most focused hour is around{" "}
              <span className="font-bold">{formatHour(powerHour.hour)}</span>,
              where you've studied a total of{" "}
              {formatMinutes(powerHour.totalTime)}.
            </p>
          ) : (
            <p>Not enough data yet.</p>
          )}
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center font-semibold mb-2">
            <CalendarCheck className="w-5 h-5 mr-2 text-blue-500" /> Most
            Productive Day
          </div>
          {mostProductiveDay ? (
            <p>
              You get the most done on{" "}
              <span className="font-bold">{mostProductiveDay.day}s</span>, with
              a total of {formatMinutes(mostProductiveDay.totalTime)} studied.
            </p>
          ) : (
            <p>Not enough data yet.</p>
          )}
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center font-semibold mb-2">
            <BookOpenCheck className="w-5 h-5 mr-2 text-green-500" /> Go-To
            Subject
          </div>
          {subjectDeepDive?.goToSubject ? (
            <p>
              You've started a session on{" "}
              <span className="font-bold">
                {subjectDeepDive.goToSubject.name}
              </span>{" "}
              more than any other subject ({subjectDeepDive.goToSubject.count}{" "}
              times).
            </p>
          ) : (
            <p>Not enough data yet.</p>
          )}
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center font-semibold mb-2">
            <Trophy className="w-5 h-5 mr-2 text-amber-600" /> Endurance Subject
          </div>
          {subjectDeepDive?.enduranceSubject ? (
            <p>
              Your longest average sessions are in{" "}
              <span className="font-bold">
                {subjectDeepDive.enduranceSubject.name}
              </span>{" "}
              at {formatMinutes(subjectDeepDive.enduranceSubject.avgLength)} per
              session.
            </p>
          ) : (
            <p>Not enough data yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StreakSection = ({
  currentStreak,
  bestStreak,
}: {
  currentStreak: number;
  bestStreak: number;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Streaks</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground flex items-center">
          <Flame className="w-4 h-4 mr-2 text-orange-500" /> Current Streak
        </span>
        <span className="font-medium">{currentStreak} days</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground flex items-center">
          <Award className="w-4 h-4 mr-2 text-yellow-500" /> Best Streak
        </span>
        <span className="font-medium">{bestStreak} days</span>
      </div>
    </CardContent>
  </Card>
);

const ContributionSection = (props: any) => (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <CardTitle>Your Study Activity</CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          {formatMinutes(props.totalContributionTimeForYear)} studied in{" "}
          {props.contributionYear}
        </p>
      </div>
      {props.availableYears.length > 0 && (
        <Select
          value={props.contributionYear.toString()}
          onValueChange={(value) => props.setContributionYear(parseInt(value))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.availableYears.map((year: number) => (
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
        data={props.contributionData}
        year={props.contributionYear}
      />
    </CardContent>
  </Card>
);
