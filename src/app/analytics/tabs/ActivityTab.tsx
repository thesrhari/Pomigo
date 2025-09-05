import { ContributionSection } from "../sections/ContributionSection";
import { StreakSection } from "../sections/StreakSection";

interface ActivityTabProps {
  contributionData: any; // Replace with a specific type
  totalContributionTimeForYear: number;
  contributionYear: number;
  setContributionYear: (year: number) => void;
  availableYears: number[];
  currentStreak: number;
  bestStreak: number;
}

export const ActivityTab = (props: ActivityTabProps) => {
  return (
    <div className="space-y-6 mt-4">
      <ContributionSection
        contributionData={props.contributionData}
        totalContributionTimeForYear={props.totalContributionTimeForYear}
        contributionYear={props.contributionYear}
        setContributionYear={props.setContributionYear}
        availableYears={props.availableYears}
      />
      <StreakSection
        currentStreak={props.currentStreak}
        bestStreak={props.bestStreak}
      />
    </div>
  );
};
