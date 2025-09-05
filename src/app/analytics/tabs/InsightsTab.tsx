import { FunStatsSection } from "../sections/FunStatsSection";
import { PersonaCard } from "../components/PersonaCard";
import { PlaceholderCard } from "../components/PlaceholderCard";
import { FunStatsData } from "@/lib/hooks/useAnalyticsData";

interface Persona {
  title: string;
  description: string;
  icon: React.ElementType;
}

interface InsightsTabProps {
  funStats: FunStatsData | null;
  persona: Persona | null;
}

export const InsightsTab = ({ funStats, persona }: InsightsTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      <div className="lg:col-span-2">
        <FunStatsSection funStats={funStats} />
      </div>
      <div>
        {persona ? (
          <PersonaCard
            title={persona.title}
            description={persona.description}
            icon={persona.icon}
          />
        ) : (
          <PlaceholderCard
            title="Persona Locked"
            message="More study data is needed to unlock your productivity persona!"
          />
        )}
      </div>
    </div>
  );
};
