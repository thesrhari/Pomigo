"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Play, Pause, Square } from "lucide-react";
import { TimerDisplay } from "./TimerDisplay";
import { SettingsModal } from "./SettingsModal";
import { toast } from "sonner";

export type TimerMode = "work" | "shortBreak" | "longBreak";
export type TimerState = "idle" | "running" | "paused";

export interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  timerStyle: "digital" | "circular";
}

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25 * 60, // 25 minutes
  shortBreakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  sessionsBeforeLongBreak: 4,
  timerStyle: "circular",
};

export const PomodoroTimer: React.FC = () => {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<TimerMode>("work");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [mouseIdleTimer, setMouseIdleTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Get duration for current mode
  const getCurrentDuration = useCallback(() => {
    switch (currentMode) {
      case "work":
        return settings.workDuration;
      case "shortBreak":
        return settings.shortBreakDuration;
      case "longBreak":
        return settings.longBreakDuration;
    }
  }, [currentMode, settings]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, timeLeft]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setTimerState("idle");

    if (currentMode === "work") {
      const newSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(newSessionCount);

      if (newSessionCount % settings.sessionsBeforeLongBreak === 0) {
        setCurrentMode("longBreak");
        setTimeLeft(settings.longBreakDuration);
        toast("Work session complete!", {
          description: "Time for a long break.",
        });
      } else {
        setCurrentMode("shortBreak");
        setTimeLeft(settings.shortBreakDuration);
        toast("Work session complete!", {
          description: "Time for a short break.",
        });
      }
    } else {
      setCurrentMode("work");
      setTimeLeft(settings.workDuration);
      toast("Break complete!", {
        description: "Time to get back to work.",
      });
    }
  }, [currentMode, sessionsCompleted, settings, toast]);

  // Mouse idle detection
  useEffect(() => {
    const handleMouseMove = () => {
      setIsUIVisible(true);

      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer);
      }

      if (timerState === "running") {
        const timer = setTimeout(() => {
          setIsUIVisible(false);
        }, 3000);
        setMouseIdleTimer(timer);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer);
      }
    };
  }, [timerState, mouseIdleTimer]);

  // Update timer when settings change
  useEffect(() => {
    if (timerState === "idle") {
      setTimeLeft(getCurrentDuration());
    }
  }, [settings, getCurrentDuration, timerState]);

  const handleStart = () => {
    setTimerState("running");
  };

  const handlePause = () => {
    setTimerState("paused");
    setIsUIVisible(true);
  };

  const handleStop = () => {
    setTimerState("idle");
    // Always revert to work session when stopping
    if (currentMode !== "work") {
      setCurrentMode("work");
      setTimeLeft(settings.workDuration);
    } else {
      setTimeLeft(getCurrentDuration());
    }
    setIsUIVisible(true);
  };

  const handleSettingsUpdate = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    if (timerState === "idle") {
      setTimeLeft(getCurrentDuration());
    }
  };

  const progress = 1 - timeLeft / getCurrentDuration();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div
        className={`w-full transition-all duration-500 ${
          !isUIVisible ? "max-w-4xl" : "max-w-md"
        }`}
      >
        {/* Timer Display */}
        <div
          className={`transition-all duration-500 ${
            !isUIVisible ? "mb-0" : "mb-12"
          }`}
        >
          <TimerDisplay
            timeLeft={timeLeft}
            mode={currentMode}
            progress={progress}
            style={settings.timerStyle}
            enlarged={!isUIVisible}
          />
        </div>

        {/* Controls */}
        <div
          className={`transition-all duration-300 ${
            !isUIVisible ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="flex justify-center items-center gap-4">
            {/* Settings Button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsSettingsOpen(true)}
              className="h-14 w-14 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <Settings className="h-6 w-6" />
            </Button>

            {/* Start/Pause Button */}
            <Button
              variant="default"
              size="lg"
              onClick={timerState === "running" ? handlePause : handleStart}
              className="h-16 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 transition-all duration-200 font-medium shadow-lg"
            >
              {timerState === "running" ? (
                <>
                  <Pause className="h-6 w-6 mr-2" />
                  Pause
                </>
              ) : timerState === "paused" ? (
                <>
                  <Play className="h-6 w-6 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-2" />
                  Start
                </>
              )}
            </Button>

            {/* Stop Button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={handleStop}
              disabled={timerState === "idle"}
              className="h-14 w-14 rounded-full hover:bg-destructive/10 disabled:opacity-30 text-muted-foreground hover:text-destructive transition-all duration-200"
            >
              <Square className="h-6 w-6" />
            </Button>
          </div>

          {/* Session Counter */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm">
              Sessions completed:{" "}
              <span className="text-primary font-medium">
                {sessionsCompleted}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={handleSettingsUpdate}
      />
    </div>
  );
};
