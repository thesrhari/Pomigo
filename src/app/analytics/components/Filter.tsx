// components/Filter.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { DateFilter } from "@/lib/hooks/useAnalyticsData";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { YearPicker, MonthPicker, WeekPicker, DayPicker } from "./DatePicker";
import { getCurrentDateForType } from "@/utils/client/date";

interface FilterComponentProps {
  filter: DateFilter;
  setFilter: (filter: DateFilter) => void;
}

export const FreeFilterComponent = ({
  filter,
  setFilter,
}: FilterComponentProps) => (
  <div className="flex items-center space-x-2">
    <Filter className="w-4 h-4 text-muted-foreground" />
    <Select
      value={filter.type}
      onValueChange={(value) =>
        setFilter({
          type: value as "today" | "week" | "month" | "all-time",
        })
      }
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
);

export const ProFilterComponent = ({
  filter,
  setFilter,
}: FilterComponentProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const filterType = filter.type.startsWith("specific_")
    ? (filter.type.substring(9) as "day" | "week" | "month" | "year")
    : "day";

  const handleDateSelect = (date: Date) => {
    setFilter({ type: filter.type, date });
    setPopoverOpen(false);
  };

  const handleTypeChange = (newType: "day" | "week" | "month" | "year") => {
    const newFilterType = `specific_${newType}` as DateFilter["type"];
    const newDate = getCurrentDateForType(newType);

    setFilter({
      type: newFilterType,
      date: newDate,
    });
  };

  const displayFormat = {
    day: "PPP",
    week: "'Week 'w, yyyy",
    month: "LLLL yyyy",
    year: "yyyy",
  }[filterType];

  const renderPicker = () => {
    // Always use a valid date - either filter.date or current date for the type
    const currentDate = filter.date || getCurrentDateForType(filterType);

    switch (filterType) {
      case "day":
        return (
          <DayPicker
            selectedDate={currentDate}
            onDateSelect={handleDateSelect}
          />
        );
      case "month":
        return (
          <MonthPicker
            selectedDate={currentDate}
            onDateSelect={handleDateSelect}
          />
        );
      case "year":
        return (
          <YearPicker
            selectedDate={currentDate}
            onDateSelect={handleDateSelect}
          />
        );
      case "week":
        return (
          <WeekPicker
            selectedDate={currentDate}
            onDateSelect={handleDateSelect}
          />
        );
      default:
        return null;
    }
  };

  // Ensure we have a valid date for display
  const displayDate = filter.date || getCurrentDateForType(filterType);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select value={filterType} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="year">Year</SelectItem>
        </SelectContent>
      </Select>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="w-[250px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayDate ? (
              format(displayDate, displayFormat)
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {renderPicker()}
        </PopoverContent>
      </Popover>
    </div>
  );
};
