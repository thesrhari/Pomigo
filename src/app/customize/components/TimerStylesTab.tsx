"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Check,
  Lock,
  Eye,
  Timer,
  FlipVertical,
  LoaderCircle,
  GitCommitHorizontal,
  Loader2,
} from "lucide-react";
import { useProStatus } from "@/lib/hooks/useProStatus";
import { useEffect, useState } from "react";

export type TimerStyle = "digital" | "ring" | "progress-bar" | "split-flap";

interface TimerStyleOption {
  id: TimerStyle;
  name: string;
  description: string;
  isPro: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface TimerStylesTabProps {
  currentStyle: TimerStyle;
  onApplyStyle: (style: TimerStyle) => void;
  onPreviewStyle: (style: TimerStyle) => void;
  onUpgradeClick: () => void;
  isUpdating: boolean;
}

const timerStyleOptions: TimerStyleOption[] = [
  {
    id: "digital",
    name: "Digital",
    description: "Classic digital countdown display",
    isPro: false,
    icon: Timer,
  },
  {
    id: "ring",
    name: "Ring Progress",
    description: "Circular progress ring with time",
    isPro: true,
    icon: LoaderCircle,
  },
  {
    id: "progress-bar",
    name: "Progress Bar",
    description: "Horizontal progress bar with time",
    isPro: true,
    icon: GitCommitHorizontal,
  },
  {
    id: "split-flap",
    name: "Split Flap",
    description: "Retro split-flap display for a vintage feel",
    isPro: true,
    icon: FlipVertical,
  },
];

export function TimerStylesTab({
  currentStyle,
  onApplyStyle,
  onPreviewStyle,
  onUpgradeClick,
  isUpdating,
}: TimerStylesTabProps) {
  const { isPro } = useProStatus();
  const [applyingStyleId, setApplyingStyleId] = useState<TimerStyle | null>(
    null
  );

  const handleApplyStyle = (styleId: TimerStyle) => {
    setApplyingStyleId(styleId);
    onApplyStyle(styleId);
  };

  // Clear the applying ID when the update is finished
  useEffect(() => {
    if (!isUpdating) {
      setApplyingStyleId(null);
    }
  }, [isUpdating]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose Your Timer Style</h2>
        <p className="text-muted-foreground">
          Customize how your timer appears during focus sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {timerStyleOptions.map((option) => {
          const isCurrentStyle = currentStyle === option.id;
          const canApply = !option.isPro || isPro;
          const IconComponent = option.icon;
          const isApplying = isUpdating && applyingStyleId === option.id;

          return (
            <Card
              key={option.id}
              className={`relative transition-all duration-200 flex flex-col ${
                isCurrentStyle
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                    {option.isPro && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                    {isCurrentStyle && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  {option.isPro && !isPro && (
                    <Badge variant="secondary">Pro</Badge>
                  )}
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 flex flex-col flex-grow">
                {/* Preview Area */}
                <div className="aspect-video bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center p-4 flex-grow">
                  {option.id === "digital" && (
                    <div className="text-center space-y-2">
                      <div className="text-5xl font-bold text-foreground tracking-tight">
                        25:00
                      </div>
                      <div className="text-sm text-muted-foreground/80">
                        Studying: <span className="text-primary/80">Math</span>
                      </div>
                    </div>
                  )}
                  {option.id === "ring" && (
                    <div className="text-center space-y-3 flex flex-col items-center">
                      <div className="relative">
                        <svg width="120" height="120" className="-rotate-90">
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            strokeWidth="8"
                            className="stroke-muted-foreground/20 fill-transparent"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            strokeWidth="8"
                            className="stroke-primary fill-transparent"
                            strokeDasharray="326.7"
                            strokeDashoffset="81.6" // 326.7 - (75/100 * 326.7)
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-2xl font-bold tracking-tight">
                            25:00
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground/80">
                        Studying: <span className="text-primary/80">Math</span>
                      </div>
                    </div>
                  )}
                  {option.id === "progress-bar" && (
                    <div className="w-full max-w-sm space-y-4">
                      <div className="text-center text-xl font-bold tracking-tight">
                        25:00
                      </div>
                      <div className="space-y-1">
                        <div className="h-4 bg-muted-foreground/10 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full w-3/4 bg-primary rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>0:00</span>
                          <span className="font-semibold text-foreground/80">
                            75% Complete
                          </span>
                          <span>30:00</span>
                        </div>
                      </div>
                      <div className="text-xs text-center text-muted-foreground/80 pt-2">
                        Studying: <span className="text-primary/80">Math</span>
                      </div>
                    </div>
                  )}
                  {option.id === "split-flap" && (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-1 scale-75">
                        <div className="relative w-12 h-16 rounded-md flex items-center justify-center text-4xl bg-card text-card-foreground font-mono">
                          2
                        </div>
                        <div className="relative w-12 h-16 rounded-md flex items-center justify-center text-4xl bg-card text-card-foreground font-mono">
                          5
                        </div>
                        <div className="text-4xl text-foreground font-mono">
                          :
                        </div>
                        <div className="relative w-12 h-16 rounded-md flex items-center justify-center text-4xl bg-card text-card-foreground font-mono">
                          0
                        </div>
                        <div className="relative w-12 h-16 rounded-md flex items-center justify-center text-4xl bg-card text-card-foreground font-mono">
                          0
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground/80">
                        Studying: <span className="text-primary/80">Math</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {canApply ? (
                    <>
                      <Button
                        onClick={() => handleApplyStyle(option.id)}
                        disabled={isCurrentStyle || isApplying}
                        variant={isCurrentStyle ? "secondary" : "default"}
                        className="w-full"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Applying
                          </>
                        ) : isCurrentStyle ? (
                          "Applied"
                        ) : (
                          "Apply"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onPreviewStyle(option.id)}
                        disabled={isApplying}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button disabled variant="outline" className="w-full">
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </Button>
                      <Button
                        onClick={() => onPreviewStyle(option.id)}
                        variant="default"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isPro && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-amber-900 dark:text-amber-100">
                Unlock Pro Timer Styles
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Access beautiful timer styles and other exclusive features with
              Pro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onUpgradeClick} className="w-full md:w-auto">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
