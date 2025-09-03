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

type ContributionGraphProps = {
  data: { date: string; count: number }[];
  year: number;
};

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

export const ContributionGraph = ({ data, year }: ContributionGraphProps) => {
  const today = new Date();
  const dataMap = new Map(data.map((item) => [item.date, item.count]));

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;

  const getColor = (count: number) => {
    if (count <= 0) return "var(--border)";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.75) return "var(--cont-graph-4)";
    if (intensity > 0.5) return "var(--cont-graph-3)";
    if (intensity > 0.25) return "var(--cont-graph-2)";
    if (intensity > 0.1) return "var(--cont-graph-1)";
    return "var(--cont-graph-5)";
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
                  key={`${month}-${colIndex}`} // <-- FIX: Use a composite key for guaranteed uniqueness
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
            style={{ backgroundColor: "var(--cont-graph-1)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--cont-graph-2)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--cont-graph-3)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--cont-graph-4)" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "var(--cont-graph-5)" }}
          />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
