import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  format,
  getYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import React from "react";

// --- TYPE DEFINITIONS (Unchanged) ---
type DailyContribution = {
  date: string; // "yyyy-MM-dd"
  totalStudyTime: number; // in minutes
  sessionCount: number;
  subjects: Record<string, number>; // e.g., { "Mathematics": 60, "History": 30 }
};

type ContributionGraphProps = {
  data: DailyContribution[];
  year: number;
};

// --- HELPER FUNCTIONS (Unchanged) ---

const formatMinutes = (minutes: number) => {
  if (minutes < 1) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
};

// --- SUB-COMPONENTS (Unchanged) ---

const ContributionTooltipContent = ({
  dayData,
}: {
  dayData: DailyContribution;
}) => {
  const { date, totalStudyTime, sessionCount, subjects } = dayData;
  const subjectEntries = Object.entries(subjects).sort((a, b) => b[1] - a[1]);
  return (
    <div className="text-sm p-1">
      <p className="font-bold">{format(new Date(date), "MMMM d, yyyy")}</p>
      <hr className="my-2 border-border" />
      <div className="space-y-2">
        <p>
          <span className="font-semibold">{formatMinutes(totalStudyTime)}</span>
          {" studied across "}
          <span className="font-semibold">
            {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
          </span>
        </p>
        {subjectEntries.length > 0 && (
          <div>
            <p className="font-semibold mb-1">Subject Breakdown:</p>
            <ul className="space-y-1 text-xs">
              {subjectEntries.map(([subject, time]) => (
                <li key={subject} className="flex justify-between items-center">
                  <span>{subject}</span>
                  <span className="font-mono ml-4">
                    {formatMinutes(time)} (
                    {((time / totalStudyTime) * 100).toFixed(0)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT (Updated for Aesthetics) ---

export const ContributionGraph = ({ data, year }: ContributionGraphProps) => {
  const today = new Date();
  const dataMap = new Map(data.map((item) => [item.date, item]));
  const maxCount =
    data.length > 0 ? Math.max(...data.map((d) => d.totalStudyTime)) : 1;

  const getColor = (count: number) => {
    if (count <= 0) return "bg-border/40";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.75) return "bg-[var(--cont-graph-5)]";
    if (intensity > 0.5) return "bg-[var(--cont-graph-4)]";
    if (intensity > 0.25) return "bg-[var(--cont-graph-3)]";
    if (intensity > 0.1) return "bg-[var(--cont-graph-2)]";
    return "bg-[var(--cont-graph-1)]";
  };

  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(year, i, 1);
    const monthName = format(monthDate, "MMM");
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    });
    const firstDayOfWeek = (getDay(daysInMonth[0]) + 6) % 7;
    return { monthName, daysInMonth, firstDayOfWeek };
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* --- RESPONSIVE GRAPH GRID (Spacing Adjusted) --- */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-x-3 sm:gap-x-4 gap-y-6 w-full">
        <TooltipProvider>
          {allMonths.map(
            ({ monthName, daysInMonth, firstDayOfWeek }, index) => (
              <div key={index}>
                {/* MONTH LABEL (Centered) */}
                <div className="text-xs text-muted-foreground pb-2 text-center">
                  {monthName}
                </div>

                {/* DAYS GRID FOR THE MONTH (Spacing Adjusted) */}
                <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
                  {/* Spacer divs to align the first day correctly */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`spacer-${i}`} />
                  ))}

                  {/* Day circles */}
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayData = dataMap.get(dateStr);
                    if (getYear(day) !== year) {
                      return (
                        <div
                          key={dateStr}
                          className="w-full aspect-square rounded-full bg-transparent"
                        />
                      );
                    }
                    const hasContribution =
                      dayData && dayData.totalStudyTime > 0;
                    return (
                      <Tooltip key={dateStr} delayDuration={150}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-full aspect-square rounded-full ${getColor(
                              dayData?.totalStudyTime || 0
                            )}`}
                          />
                        </TooltipTrigger>
                        {day <= today && (
                          <TooltipContent>
                            {hasContribution ? (
                              <ContributionTooltipContent dayData={dayData} />
                            ) : (
                              <p>
                                No study activity on{" "}
                                {format(day, "MMM d, yyyy")}
                              </p>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </TooltipProvider>
      </div>
      {/* LEGEND (Unchanged) */}
      <div className="flex justify-end items-center text-xs text-muted-foreground mt-8 gap-2 w-full">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-border/40" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[var(--cont-graph-1)]" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[var(--cont-graph-2)]" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[var(--cont-graph-3)]" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[var(--cont-graph-4)]" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
