"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Crown, Sparkles, Zap, Infinity, Loader2 } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { toast } from "react-toastify";

// 3. Remove onUpgrade from props
interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
  const { user, profile } = useProfile();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // 5. The checkout logic is now inside the modal
  const handleCheckout = async (
    planName: string,
    planType: "monthly" | "yearly" | "lifetime"
  ) => {
    if (!user || !profile) {
      toast.error("You must be logged in to upgrade.");
      return;
    }

    setLoadingPlan(planName);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error("Failed to create checkout session. Please try again.");
      }
    } catch (error) {
      console.error("An error occurred during checkout:", error);
      toast.error("An error occurred during checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      name: "Free",
      price: 0,
      period: "forever",
      features: [
        "Create up to 3 subjects",
        "Latest 20 friend activities",
        "Unlimited friends",
        "Basic Analytics",
        "Friend leaderboards",
      ],
      buttonText: "Continue Free",
      variant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      price: isYearly ? 9.99 : 2.99,
      period: isYearly ? "year" : "month",
      features: [
        "Everything in Free",
        "Unlimited subjects",
        "48 hour friend activity history",
        "Advanced analytics",
        "Custom themes",
        "Cusom timer styles",
        "Access to all upcoming pro features",
      ],
      buttonText: `Get Pro ${isYearly ? "Yearly" : "Monthly"}`,
      variant: "default" as const,
      popular: true,
      icon: Sparkles,
      savings: isYearly ? "$0.83/month - Save 72%" : null,
    },
    {
      name: "Lifetime",
      price: 19.99,
      period: "lifetime",
      features: [
        "Everything in Pro",
        "All future updates",
        "No recurring payments",
        "Lifetime support",
        "Lifetime access to all upcoming pro features",
      ],
      buttonText: "Get Lifetime Access",
      variant: "secondary" as const,
      popular: false,
      icon: Crown,
      special: true,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[95vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 text-center">
          <DialogTitle className="text-2xl font-semibold mb-1">
            Choose your plan
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upgrade now. Cancel anytime.
          </p>
        </DialogHeader>

        <div className="px-6 py-6 overflow-y-auto flex-1">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2">
              <span
                className={`text-sm transition-colors ${
                  !isYearly
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
                disabled={loadingPlan !== null}
              />
              <span
                className={`text-sm transition-colors ${
                  isYearly
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                Yearly
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isProPlan = plan.name === "Pro";
              const actualPrice = isProPlan
                ? isYearly
                  ? 9.99
                  : 2.99
                : plan.price;
              const actualPeriod = isProPlan
                ? isYearly
                  ? "year"
                  : "month"
                : plan.period;
              const showSavings = isProPlan && isYearly;

              const isLoading = loadingPlan === plan.name;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border bg-card p-6 transition-all hover:shadow-lg flex flex-col ${
                    plan.popular
                      ? "border-primary/50 shadow-sm"
                      : plan.special
                      ? "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                        <Crown className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {plan.special && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-500 text-white text-xs px-3 py-1 rounded-full">
                        <Infinity className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {plan.icon && (
                        <plan.icon
                          className={`h-5 w-5 ${
                            plan.special ? "text-amber-600" : "text-primary"
                          }`}
                        />
                      )}
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">
                          ${actualPrice}
                        </span>
                        {actualPeriod !== "forever" &&
                          actualPeriod !== "lifetime" && (
                            <span className="text-muted-foreground">
                              /{actualPeriod}
                            </span>
                          )}
                      </div>

                      {showSavings && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {plans[1].savings}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {plan.period === "lifetime" && (
                      <p className="text-sm text-muted-foreground">
                        Pay once, own forever
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            plan.special
                              ? "text-amber-600"
                              : plan.popular
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-sm text-foreground leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {/* 6. Update onClick to call the new internal handleCheckout function */}
                    <Button
                      onClick={() => {
                        if (plan.name === "Free") {
                          onClose();
                          return;
                        }
                        const planType =
                          plan.name === "Lifetime"
                            ? "lifetime"
                            : isYearly
                            ? "yearly"
                            : "monthly";
                        handleCheckout(plan.name, planType);
                      }}
                      disabled={loadingPlan !== null}
                      variant={plan.variant}
                      className={`w-full h-11 font-medium transition-all ${
                        plan.special
                          ? "bg-amber-600 hover:bg-amber-700 text-white border-0"
                          : plan.popular
                          ? "shadow-sm"
                          : ""
                      }`}
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          <span className="ml-2">{plan.buttonText}</span>
                        </>
                      ) : (
                        <>
                          {plan.name === "Pro" && (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          {plan.name === "Lifetime" && (
                            <Infinity className="h-4 w-4 mr-2" />
                          )}
                          {plan.buttonText}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 pt-4 border-t border-border/50"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
