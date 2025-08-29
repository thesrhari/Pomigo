import React from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  feature: {
    icon: LucideIcon;
    title: string;
    description: string;
    color: string;
  };
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  const Icon = feature.icon;

  return (
    <div className="group rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-card hover:shadow-xl sm:p-8">
      {/* Icon Container */}
      <div
        className={`mb-4 h-12 w-12 rounded-xl bg-${feature.color} p-3 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-16 sm:w-16 sm:rounded-2xl sm:p-4`}
      >
        <Icon className="h-6 w-6 text-white sm:h-8 sm:w-8" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-bold text-card-foreground sm:mb-3 sm:text-xl">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
        {feature.description}
      </p>
    </div>
  );
};

export default FeatureCard;
