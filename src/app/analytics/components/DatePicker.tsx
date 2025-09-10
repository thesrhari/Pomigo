// components/DatePicker.tsx
"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  addDays,
  getYear,
  setYear,
  getMonth,
  setMonth,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const YearPicker = ({ selectedDate, onDateSelect }: DatePickerProps) => {
  const [year, setYear] = useState(getYear(selectedDate));
  const years = Array.from({ length: 10 }, (_, i) => year - 5 + i);

  const handleYearClick = (y: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(y);
    onDateSelect(newDate);
  };

  return (
    <div className="flex flex-col items-center p-2">
      <div className="flex items-center justify-between w-full px-2 mb-2">
        <Button variant="ghost" size="icon" onClick={() => setYear(year - 10)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-semibold">
          {years[0]} - {years[9]}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setYear(year + 10)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {years.map((y) => (
          <Button
            key={y}
            variant={y === getYear(selectedDate) ? "default" : "ghost"}
            onClick={() => handleYearClick(y)}
          >
            {y}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const MonthPicker = ({
  selectedDate,
  onDateSelect,
}: DatePickerProps) => {
  const [year, setYear] = useState(getYear(selectedDate));
  const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(year, i), "MMM")
  );

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    newDate.setMonth(monthIndex);
    onDateSelect(newDate);
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between w-full px-2 mb-2">
        <Button variant="ghost" size="icon" onClick={() => setYear(year - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-semibold">{year}</div>
        <Button variant="ghost" size="icon" onClick={() => setYear(year + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, i) => (
          <Button
            key={month}
            variant={
              i === getMonth(selectedDate) && year === getYear(selectedDate)
                ? "default"
                : "ghost"
            }
            onClick={() => handleMonthClick(i)}
          >
            {month}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const WeekPicker = ({ selectedDate, onDateSelect }: DatePickerProps) => {
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(selectedDate));

  const weeks = useMemo(() => {
    const start = startOfMonth(displayMonth);
    const end = endOfMonth(displayMonth);
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  }, [displayMonth]);

  const handlePrevMonth = () => {
    setDisplayMonth(startOfMonth(addDays(displayMonth, -1)));
  };

  const handleNextMonth = () => {
    setDisplayMonth(startOfMonth(addDays(endOfMonth(displayMonth), 1)));
  };

  const handleWeekClick = (weekStart: Date) => {
    onDateSelect(weekStart);
  };

  return (
    <div className="p-2 w-80">
      <div className="flex items-center justify-between w-full px-2 mb-2">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-semibold">{format(displayMonth, "MMMM yyyy")}</div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {weeks.map((weekStart, i) => {
          const weekEnd = addDays(weekStart, 6);
          const isSelected =
            isSameMonth(weekStart, selectedDate) &&
            format(weekStart, "w") === format(selectedDate, "w");
          return (
            <Button
              key={i}
              variant={isSelected ? "default" : "ghost"}
              className="w-full justify-start text-sm"
              onClick={() => handleWeekClick(weekStart)}
            >
              Week {format(weekStart, "w")}: {format(weekStart, "MMM d")} -{" "}
              {format(weekEnd, "MMM d")}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export const DayPicker = ({ selectedDate, onDateSelect }: DatePickerProps) => {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
    }
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleDateSelect}
      initialFocus
    />
  );
};
