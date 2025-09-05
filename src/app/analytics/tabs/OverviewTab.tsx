import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeFilter } from "@/lib/hooks/useAnalyticsData";
import { FilterableContent } from "../sections/FilterableContent";
import { Filter } from "lucide-react";

interface OverviewTabProps {
  data: any; // Replace 'any' with a more specific type if available
  dateFilter: TimeFilter;
  setDateFilter: (value: TimeFilter) => void;
}

export const OverviewTab = ({
  data,
  dateFilter,
  setDateFilter,
}: OverviewTabProps) => {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Period Overview</CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-6">
        <FilterableContent data={data} />
      </CardContent>
    </Card>
  );
};
