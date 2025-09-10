// utils/date.ts
import { startOfWeek, startOfDay, startOfMonth, startOfYear } from "date-fns";

export const getCurrentDateForType = (
  type: "day" | "week" | "month" | "year"
): Date => {
  const now = new Date();
  switch (type) {
    case "day":
      return startOfDay(now);
    case "week":
      return startOfWeek(now, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(now);
    case "year":
      return startOfYear(now);
    default:
      return now;
  }
};
