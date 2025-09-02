import React from "react";
import { Play, TrendingUp, Users } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Start Your Session",
    description:
      "Choose a subject, set your timer, and begin a focused Pomodoro session.",
    icon: Play,
  },
  {
    number: "02",
    title: "Track Your Progress",
    description:
      "Monitor your daily hours, maintain streaks, and see detailed analytics.",
    icon: TrendingUp,
  },
  {
    number: "03",
    title: "Stay Motivated Together",
    description:
      "Connect with friends, share achievements, and build study habits together.",
    icon: Users,
  },
];

const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="w-full bg-muted/30 py-16 sm:py-20 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:mb-6 sm:text-4xl lg:text-5xl">
            How It Works
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
            Get started in minutes and transform your study habits forever.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="group text-center">
                {/* Icon Container with Step Number */}
                <div className="relative mb-6 sm:mb-8">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24">
                    <Icon className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-card text-sm font-bold text-card-foreground shadow-lg sm:-right-2 sm:-top-2 sm:h-10 sm:w-10 sm:text-lg">
                    {step.number}
                  </div>
                </div>

                {/* Step Title */}
                <h3 className="mb-3 text-xl font-bold text-foreground sm:mb-4 sm:text-2xl">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="mt-10 text-center sm:mt-12">
          <button className="transform rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-xl sm:px-8 sm:py-4 sm:text-base lg:text-lg">
            Upgrade to Pro - $2.99/month
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
