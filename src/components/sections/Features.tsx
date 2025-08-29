import React from "react";
import { Timer, BookOpen, CheckCircle, BarChart3, Users } from "lucide-react";
import FeatureCard from "../FeatureCard";

const features = [
  {
    icon: Timer,
    title: "Customizable Pomodoro Timer",
    description:
      "Focus with 25-minute sessions, or customize your perfect study rhythm.",
    color: "primary",
  },
  {
    icon: BookOpen,
    title: "Subject Tagging",
    description:
      "Organize your study sessions by subject and track time across different topics.",
    color: "primary",
  },
  {
    icon: CheckCircle,
    title: "Smart To-Do Lists",
    description:
      "Break down your goals into actionable tasks with deadlines and priorities.",
    color: "primary",
  },
  {
    icon: BarChart3,
    title: "Analytics & Streaks",
    description:
      "Visualize your progress with detailed charts and maintain study streaks.",
    color: "primary",
  },
  {
    icon: Users,
    title: "Friends & Leaderboards",
    description:
      "Study with friends, see their progress, and compete on weekly leaderboards.",
    color: "primary",
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section
      id="features"
      className="w-full bg-background py-16 sm:py-20 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:mb-6 sm:text-4xl lg:text-5xl">
            Everything you need to focus
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
            Pomigo combines the proven Pomodoro Technique with social
            accountability to help you build consistent study habits.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
