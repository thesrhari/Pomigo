import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Basic Pomodoro Timer",
      "Subject Tagging",
      "Simple Analytics",
      "Up to 5 Friends",
      "Basic To-Do Lists",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$2.99",
    period: "per month",
    features: [
      "Everything in Free",
      "Unlimited Study Circles",
      "Advanced Analytics",
      "Motivation Boosters",
      "Calendar Integration",
      "Custom Themes & Sounds",
      "Priority Support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
];

const PricingCard: React.FC<{ plan: PricingPlan }> = ({ plan }) => {
  return (
    <Card
      className={`relative h-full transition-all duration-300 hover:shadow-lg ${
        plan.popular ? "border-primary shadow-lg scale-105" : "border-border"
      }`}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-foreground">
          {plan.name}
        </CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-foreground">
            {plan.price}
          </span>
          <span className="text-muted-foreground ml-1">/{plan.period}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.popular ? "default" : "outline"}
        >
          {plan.cta}
        </Button>
      </CardFooter>
    </Card>
  );
};

const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Start Free, Upgrade Anytime
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that fits your study goals. No commitments, cancel
            anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
