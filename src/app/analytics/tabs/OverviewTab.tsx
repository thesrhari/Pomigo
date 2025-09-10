// OverviewTab.tsx
import { User } from "@supabase/supabase-js";
import { DateFilter } from "@/lib/hooks/useAnalyticsData";
import { FilterableContent } from "../sections/FilterableContent";

interface OverviewTabProps {
  user: User | null;
  data: any; // Replace 'any' with a more specific type if available
  dateFilter: DateFilter;
  setDateFilter: (value: DateFilter) => void;
}

export const OverviewTab = ({
  user,
  data,
  dateFilter,
  setDateFilter,
}: OverviewTabProps) => {
  return (
    <FilterableContent
      user={user}
      data={data}
      filter={dateFilter}
      setFilter={setDateFilter}
    />
  );
};
