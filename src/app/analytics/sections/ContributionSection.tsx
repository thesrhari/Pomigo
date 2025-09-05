"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContributionGraph } from "../components/ContributionGraph";
import { formatMinutes } from "@/utils/client/formatMinutes";

interface ContributionSectionProps {
  contributionData: any; // Define a more specific type
  totalContributionTimeForYear: number;
  contributionYear: number;
  setContributionYear: (year: number) => void;
  availableYears: number[];
}

export const ContributionSection = ({
  contributionData,
  totalContributionTimeForYear,
  contributionYear,
  setContributionYear,
  availableYears,
}: ContributionSectionProps) => (
  <Card>
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <CardTitle>Your Study Activity</CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          {formatMinutes(totalContributionTimeForYear)} studied in{" "}
          {contributionYear}
        </p>
      </div>
      {availableYears.length > 0 && (
        <Select
          value={contributionYear.toString()}
          onValueChange={(value) => setContributionYear(parseInt(value))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year: number) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </CardHeader>
    <CardContent className="px-4 sm:px-6 pb-6 pt-0">
      <ContributionGraph data={contributionData} year={contributionYear} />
    </CardContent>
  </Card>
);
