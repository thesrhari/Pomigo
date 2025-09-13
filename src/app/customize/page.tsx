"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingModal } from "@/components/PricingModal";
import { ThemesTab } from "./components/ThemesTab";
import { TimerStylesTab, TimerStyle } from "./components/TimerStylesTab";
import { FullscreenTimerOverlay } from "@/components/features/FullscreenTimerOverlay";
import { useUserPreferences } from "@/components/UserPreferencesProvider";

// Mock session data for preview
const mockSessionSequence = [
  { type: "study" as const, completed: false },
  { type: "short_break" as const, completed: false },
  { type: "study" as const, completed: false },
  { type: "short_break" as const, completed: false },
  { type: "study" as const, completed: false },
  { type: "short_break" as const, completed: false },
  { type: "study" as const, completed: false },
  { type: "long_break" as const, completed: false },
];

export default function ThemeSelectorPage() {
  const router = useRouter();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Timer style state management
  const {
    timerStyle: currentTimerStyle,
    applyTimerStyle: handleApplyTimerStyle,
    isUpdating,
  } = useUserPreferences();
  const [isTimerPreviewOpen, setIsTimerPreviewOpen] = useState(false);
  const [previewTimerStyle, setPreviewTimerStyle] =
    useState<TimerStyle>("digital");
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);

  const handlePreviewTimerStyle = (style: TimerStyle) => {
    // Clear any existing preview timer
    if (previewTimer) {
      clearTimeout(previewTimer);
    }

    setPreviewTimerStyle(style);
    setIsTimerPreviewOpen(true);

    // Auto-close preview after 30 seconds
    const timer = setTimeout(() => {
      setIsTimerPreviewOpen(false);
      setPreviewTimer(null);
    }, 30000);

    setPreviewTimer(timer);
  };

  const handleClosePreview = () => {
    if (previewTimer) {
      clearTimeout(previewTimer);
      setPreviewTimer(null);
    }
    setIsTimerPreviewOpen(false);
  };

  // Mock timer functions for preview
  const mockTimerProps = {
    isOpen: isTimerPreviewOpen,
    timeLeft: 1200, // 25 minutes
    currentSubject: "Math",
    sessionType: "study" as const,
    currentCycle: 1,
    sessionSequence: mockSessionSequence,
    currentSessionIndex: 0,
    timerRunning: true,
    timerStyle: previewTimerStyle,
    pomodoroSettings: null,
    onToggleTimer: () => {},
    onReset: handleClosePreview,
    onClose: handleClosePreview,
    onSkip: () => {},
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 lg:px-6 py-4 bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Customize</h1>
        </div>
      </div>

      {/* Content with sidebar-aware padding */}
      <div className="px-4 lg:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="themes" className="w-full">
            <TabsList className="w-full justify-start rounded-lg bg-card-foreground/10 p-0 gap-2">
              <TabsTrigger className="tabstrigger" value="themes">
                Themes
              </TabsTrigger>
              <TabsTrigger className="tabstrigger" value="timer-styles">
                Timer Styles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="themes" className="mt-8">
              <ThemesTab onUpgradeClick={() => setIsPricingModalOpen(true)} />
            </TabsContent>

            <TabsContent value="timer-styles" className="mt-8">
              <TimerStylesTab
                currentStyle={currentTimerStyle}
                onApplyStyle={handleApplyTimerStyle}
                onPreviewStyle={handlePreviewTimerStyle}
                onUpgradeClick={() => setIsPricingModalOpen(true)}
                isUpdating={isUpdating}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Timer Preview Overlay */}
      <FullscreenTimerOverlay {...mockTimerProps} />
    </div>
  );
}
