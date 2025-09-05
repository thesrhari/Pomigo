"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Award } from "lucide-react";

interface StreakSectionProps {
  currentStreak: number;
  bestStreak: number;
}

export const StreakSection = ({
  currentStreak,
  bestStreak,
}: StreakSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Streaks</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground flex items-center">
          <Flame className="w-4 h-4 mr-2 text-orange-500" /> Current Streak
        </span>
        <span className="font-medium">{currentStreak} days</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground flex items-center">
          <Award className="w-4 h-4 mr-2 text-yellow-500" /> Best Streak
        </span>
        <span className="font-medium">{bestStreak} days</span>
      </div>
    </CardContent>
  </Card>
);
