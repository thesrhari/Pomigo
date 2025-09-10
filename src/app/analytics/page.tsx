// AnalyticsPage.tsx
"use client";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAnalyticsData, DateFilter } from "@/lib/hooks/useAnalyticsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsPageSkeleton } from "./components/AnalyticsPageSkeleton";
import { OverviewTab } from "./tabs/OverviewTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { InsightsTab } from "./tabs/InsightsTab";
import { Sun, Moon } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";

// --- HELPER FUNCTIONS (Unchanged) ---
export const formatHour = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${h}${ampm}`;
};

// --- MAIN PAGE COMPONENT ---
export default function AnalyticsPage() {
  const { user } = useUser();
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: "today" });
  const [contributionYear, setContributionYear] = useState<number>(
    new Date().getFullYear()
  );

  const { data, loading, error, availableYears } = useAnalyticsData(
    dateFilter,
    contributionYear
  );

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

  const { productiveHours } = data;

  const personaContent = productiveHours
    ? {
        title: productiveHours.isEarlyBird ? "Early Bird" : "Night Owl",
        description: `You complete the most number of sessions between ${formatHour(
          productiveHours.start
        )} and ${formatHour(productiveHours.end)}!`,
        icon: productiveHours.isEarlyBird ? Sun : Moon,
      }
    : null;

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Your study habits, visualized.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="tabstrigger">
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="tabstrigger">
            Activity
          </TabsTrigger>
          <TabsTrigger value="insights" className="tabstrigger">
            Insights
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab
            user={user || null}
            data={data}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab
            contributionData={data.contributionData}
            totalContributionTimeForYear={data.totalContributionTimeForYear}
            contributionYear={contributionYear}
            setContributionYear={setContributionYear}
            availableYears={availableYears}
            currentStreak={data.currentStreak}
            bestStreak={data.bestStreak}
          />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab funStats={data.funStats} persona={personaContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
