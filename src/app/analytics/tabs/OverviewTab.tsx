// OverviewTab.tsx
import { DateFilter } from "@/lib/hooks/useAnalyticsData";
import { FilterableContent } from "../sections/FilterableContent";

interface OverviewTabProps {
  data: any; // Replace 'any' with a more specific type if available
  dateFilter: DateFilter;
  setDateFilter: (value: DateFilter) => void;
}

export const OverviewTab = ({
  data,
  dateFilter,
  setDateFilter,
}: OverviewTabProps) => {
  return (
    <FilterableContent
      data={data}
      filter={dateFilter}
      setFilter={setDateFilter}
    />
  );
};
