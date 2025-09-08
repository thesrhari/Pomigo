"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceholderCard } from "../components/PlaceholderCard";
import { FunStatsData } from "@/lib/hooks/useAnalyticsData";
import { Zap, CalendarCheck, BookOpenCheck, Trophy } from "lucide-react";
import { formatMinutes } from "@/utils/client/formatMinutes";

const formatHour = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${h}${ampm}`;
};

interface FunStatsSectionProps {
  funStats: FunStatsData | null;
}

export const FunStatsSection = ({ funStats }: FunStatsSectionProps) => {
  if (!funStats) {
    return (
      <PlaceholderCard
        title="Habits Locked"
        message="More study data is needed to unlock your habits."
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
              where you&apos;ve studied a total of{" "}
              {formatMinutes(powerHour.totalTime)}.
            </p>
          ) : (
            <p className="text-muted-foreground">Not enough data yet.</p>
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
            <p className="text-muted-foreground">Not enough data yet.</p>
          )}
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center font-semibold mb-2">
            <BookOpenCheck className="w-5 h-5 mr-2 text-green-500" /> Go-To
            Subject
          </div>
          {subjectDeepDive?.goToSubject ? (
            <p>
              You&apos;ve started a session on{" "}
              <span className="font-bold">
                {subjectDeepDive.goToSubject.name}
              </span>{" "}
              more than any other subject ({subjectDeepDive.goToSubject.count}{" "}
              times).
            </p>
          ) : (
            <p className="text-muted-foreground">Not enough data yet.</p>
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
            <p className="text-muted-foreground">Not enough data yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
