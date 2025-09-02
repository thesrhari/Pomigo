// components/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  numericValue?: number;
  comparisonValue?: number;
}

const calculatePercentageChange = (current?: number, previous?: number) => {
  if (previous === undefined || current === undefined || previous === 0) {
    return null;
  }
  const change = ((current - previous) / previous) * 100;
  // Avoid showing "+Infinity%" if previous was 0 and current is > 0
  if (!isFinite(change)) return null;
  return Math.round(change);
};

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  numericValue,
  comparisonValue,
}: StatCardProps) {
  const percentageChange = calculatePercentageChange(
    numericValue,
    comparisonValue
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className="w-5 h-5 text-muted-foreground"
          style={{ color: `hsl(var(${color}))` }}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {percentageChange !== null && (
          <p
            className={`text-xs flex items-center ${
              percentageChange >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {percentageChange >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {percentageChange >= 0 ? "+" : ""}
            {percentageChange}% vs. last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
