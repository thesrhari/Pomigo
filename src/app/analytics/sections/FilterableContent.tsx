// FilterableContent.tsx
"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProStatus } from "@/lib/hooks/useProStatus";
import { DateFilter } from "@/lib/hooks/useAnalyticsData";
import { FreeFilterComponent, ProFilterComponent } from "../components/Filter";
import {
  StudyStatsGrid,
  SubjectDistributionChart,
  BreakdownCard,
} from "../components/Statistics";
import { PricingModal } from "@/components/PricingModal";
import { getCurrentDateForType } from "@/utils/client/date";

interface FilterableContentProps {
  user: User | null;
  data: {
    totalStudyTime: number;
    totalStudySessions: number;
    averageSessionLength: number;
    totalTimePerSubject: { name: string; value: number; color: string }[];
    totalBreakTime: number;
    totalShortBreakTime: number;
    totalLongBreakTime: number;
  };
  filter: DateFilter;
  setFilter: (filter: DateFilter) => void;
}

export const FilterableContent = ({
  user,
  data,
  filter,
  setFilter,
}: FilterableContentProps) => {
  const { isPro, isLoading } = useProStatus(user);
  const {
    totalStudyTime,
    totalStudySessions,
    averageSessionLength,
    totalTimePerSubject,
    totalBreakTime,
    totalShortBreakTime,
    totalLongBreakTime,
  } = data;

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  useEffect(() => {
    // Wait until the pro status has been determined
    if (isLoading) {
      return;
    }

    if (isPro) {
      const newFilter = { ...filter };
      let needsUpdate = false;

      // If the current filter is a "free" type, convert it to the "pro" equivalent.
      // This handles the initial load where the default is "today".
      if (["today", "week", "month"].includes(newFilter.type)) {
        const proType = `specific_${
          newFilter.type === "today" ? "day" : newFilter.type
        }`;
        newFilter.type = proType as DateFilter["type"];
        needsUpdate = true;
      }

      // If the filter is a "pro" type but is missing a date, add the current date.
      // This fixes the original problem.
      if (newFilter.type.startsWith("specific_") && !newFilter.date) {
        const filterType = newFilter.type.substring(9) as
          | "day"
          | "week"
          | "month"
          | "year";
        newFilter.date = getCurrentDateForType(filterType);
        needsUpdate = true;
      }

      if (needsUpdate) {
        setFilter(newFilter);
      }
    } else {
      // If the user is NOT pro, ensure they are not on a pro-only filter type.
      if (filter.type.startsWith("specific_")) {
        setFilter({ type: "today" }); // Revert to a safe default for free users
      }
    }
  }, [isPro, isLoading, filter, setFilter]);

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="pt-2">Period Overview</CardTitle>
          <div className="flex flex-col items-end gap-2">
            {isLoading ? (
              <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
            ) : isPro ? (
              <ProFilterComponent filter={filter} setFilter={setFilter} />
            ) : (
              <FreeFilterComponent filter={filter} setFilter={setFilter} />
            )}
            {!isLoading && !isPro && (
              <p className="text-xs text-muted-foreground pr-1">
                ✨{" "}
                <a
                  onClick={() => setIsPricingModalOpen(true)}
                  className="underline cursor-pointer hover:text-primary"
                >
                  Upgrade to Pro
                </a>{" "}
                to filter by a custom date.
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <StudyStatsGrid
            totalStudyTime={totalStudyTime}
            totalStudySessions={totalStudySessions}
            averageSessionLength={averageSessionLength}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SubjectDistributionChart
              totalTimePerSubject={totalTimePerSubject}
            />
            <BreakdownCard
              totalStudyTime={totalStudyTime}
              totalBreakTime={totalBreakTime}
              totalShortBreakTime={totalShortBreakTime}
              totalLongBreakTime={totalLongBreakTime}
            />
          </div>
        </CardContent>
      </Card>
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </>
  );
};
