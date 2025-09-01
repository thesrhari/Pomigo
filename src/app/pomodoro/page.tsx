"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PomodoroSettings } from "@/components/features/PomodoroSettings";
import { SubjectManager } from "@/components/features/SubjectManager";
import { FullscreenTimerOverlay } from "@/components/features/FullscreenTimerOverlay";
import { Play, Pause, Settings, Book } from "lucide-react";
import { usePomodoroTracker } from "@/lib/hooks/usePomodoroTracker";
import { useSupabaseData } from "@/lib/hooks/useSupabaseData";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type SessionType = "focus" | "shortBreak" | "longBreak";

interface SessionStatus {
  type: SessionType;
  completed: boolean;
}

export default function PomodoroPage() {
  // Supabase data hook
  const {
    subjects,
    pomodoroSettings,
    loading,
    error,
    updateSubjects,
    deleteSubject,
    updatePomodoroSettings,
  } = useSupabaseData();

  // Local state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSubject, setCurrentSubject] = useState("Uncategorized");
  const [pomodoroSettingsOpen, setPomodoroSettingsOpen] = useState(false);
  const [fullscreenOverlayOpen, setFullscreenOverlayOpen] = useState(false);

  // Cycling state
  const [currentSessionType, setCurrentSessionType] =
    useState<SessionType>("focus");
  const [currentCycle, setCurrentCycle] = useState(1);
  const [completedSessions, setCompletedSessions] = useState<SessionStatus[]>(
    []
  );

  // Track if timer was manually paused vs reset/stopped
  const isPausedRef = useRef(false);
  const previousFocusTimeRef = useRef(0);

  // Helper function to get session duration
  const getSessionDuration = (sessionType: SessionType): number => {
    if (!pomodoroSettings) return 25; // Default
    switch (sessionType) {
      case "focus":
        return pomodoroSettings.focusTime;
      case "shortBreak":
        return pomodoroSettings.shortBreak;
      case "longBreak":
        return pomodoroSettings.longBreak;
      default:
        return 25;
    }
  };

  // Helper function to get next session type
  const getNextSessionType = (): SessionType => {
    if (currentSessionType === "focus") {
      // Check if we should have a long break
      if (
        pomodoroSettings?.longBreakEnabled &&
        currentCycle % pomodoroSettings.longBreakInterval === 0
      ) {
        return "longBreak";
      }
      return "shortBreak";
    }
    // After any break, check if we've completed all cycles
    if (currentCycle >= (pomodoroSettings?.iterations || 1)) {
      // All cycles completed, could reset or stop
      return "focus"; // Or handle completion differently
    }
    return "focus"; // After any break, return to focus
  };

  // Generate session sequence for indicators - all cycles end with breaks
  const generateSessionSequence = (): SessionStatus[] => {
    if (!pomodoroSettings) return [];

    const sequence: SessionStatus[] = [];
    const totalCycles = pomodoroSettings.iterations;

    for (let cycle = 1; cycle <= totalCycles; cycle++) {
      // Add focus session
      sequence.push({
        type: "focus",
        completed: completedSessions.some(
          (s, i) => i === (cycle - 1) * 2 && s.type === "focus" && s.completed
        ),
      });

      // Always add break session after each cycle
      const isLongBreak =
        pomodoroSettings.longBreakEnabled &&
        cycle % pomodoroSettings.longBreakInterval === 0;

      sequence.push({
        type: isLongBreak ? "longBreak" : "shortBreak",
        completed: completedSessions.some(
          (s, i) =>
            i === (cycle - 1) * 2 + 1 &&
            s.type === (isLongBreak ? "longBreak" : "shortBreak") &&
            s.completed
        ),
      });
    }

    return sequence;
  };

  // Initialize timer when pomodoroSettings loads
  useEffect(() => {
    if (pomodoroSettings && timeLeft === 0 && !timerRunning) {
      setTimeLeft(getSessionDuration(currentSessionType) * 60);
      previousFocusTimeRef.current = pomodoroSettings.focusTime;
    }
  }, [pomodoroSettings, timeLeft, timerRunning, currentSessionType]);

  // Set default subject when subjects load
  useEffect(() => {
    if (subjects && subjects.length > 0 && !currentSubject) {
      setCurrentSubject(subjects[0].name);
    }
  }, [subjects, currentSubject]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      // Timer completed
      setTimerRunning(false);
      setFullscreenOverlayOpen(false);
      isPausedRef.current = false;

      // Mark current session as completed
      setCompletedSessions((prev) => {
        const newCompleted = [...prev];
        const currentIndex =
          (currentCycle - 1) * 2 + (currentSessionType === "focus" ? 0 : 1);
        newCompleted[currentIndex] = {
          type: currentSessionType,
          completed: true,
        };
        return newCompleted;
      });

      // Auto-advance to next session
      const nextSessionType = getNextSessionType();

      // Check if all cycles are completed
      if (
        currentCycle >= (pomodoroSettings?.iterations || 1) &&
        currentSessionType !== "focus"
      ) {
        // All cycles completed - could show completion message or reset
        console.log("All pomodoro cycles completed!");
        // For now, we'll just stay at the current state
        return;
      }

      setCurrentSessionType(nextSessionType);

      // Update cycle count when moving from break back to focus
      if (currentSessionType !== "focus" && nextSessionType === "focus") {
        setCurrentCycle((prev) => prev + 1);
      }

      // Set timer for next session
      const nextDuration = getSessionDuration(nextSessionType);
      setTimeLeft(nextDuration * 60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    timerRunning,
    timeLeft,
    currentSessionType,
    currentCycle,
    pomodoroSettings,
  ]);

  // Update timer when focus time setting changes (only if not paused)
  useEffect(() => {
    if (!pomodoroSettings) return;

    const focusTimeChanged =
      previousFocusTimeRef.current !== pomodoroSettings.focusTime;

    if (
      focusTimeChanged &&
      !timerRunning &&
      !isPausedRef.current &&
      currentSessionType === "focus"
    ) {
      setTimeLeft(pomodoroSettings.focusTime * 60);
    }

    previousFocusTimeRef.current = pomodoroSettings.focusTime;
  }, [pomodoroSettings?.focusTime, timerRunning, currentSessionType]);

  usePomodoroTracker({
    timerRunning,
    timeLeft,
    focusDuration: pomodoroSettings?.focusTime,
    shortBreakDuration: pomodoroSettings?.shortBreak,
    longBreakDuration: pomodoroSettings?.longBreak,
    currentSubject,
    sessionType: currentSessionType,
  });

  // Helper function to get current session display name
  const getSessionDisplayName = (): string => {
    switch (currentSessionType) {
      case "focus":
        return "Focus Session";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
      default:
        return "Focus Session";
    }
  };

  // Helper function to get button text
  const getButtonText = () => {
    if (timerRunning) return "Pause";
    if (isPausedRef.current) return "Resume";
    return "Start";
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (timerRunning) {
      // Pausing
      isPausedRef.current = true;
      setTimerRunning(false);
    } else {
      // Starting/Resuming
      isPausedRef.current = false;
      setTimerRunning(true);
      // Only open fullscreen when starting fresh (not resuming)
      if (timeLeft === getSessionDuration(currentSessionType) * 60) {
        setFullscreenOverlayOpen(true);
      }
    }
  };

  const handleReset = () => {
    // Reset to first focus session
    setCurrentSessionType("focus");
    setCurrentCycle(1);
    setCompletedSessions([]);
    setTimeLeft(pomodoroSettings?.focusTime * 60 || 1500);
    setTimerRunning(false);
    setFullscreenOverlayOpen(false);
    isPausedRef.current = false;
  };

  const handleOverlayToggleTimer = () => {
    if (timerRunning) {
      isPausedRef.current = true;
      setTimerRunning(false);
    } else {
      isPausedRef.current = false;
      setTimerRunning(true);
    }
  };

  const handleOverlayReset = () => {
    handleReset();
  };

  const handleCloseOverlay = () => {
    setFullscreenOverlayOpen(false);
  };

  // Handle pomodoro settings update
  const handleUpdatePomodoroSettings = async (
    newSettings: typeof pomodoroSettings
  ) => {
    try {
      // Get current user for the update
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await updatePomodoroSettings(newSettings, user.id);
      }
    } catch (err) {
      console.error("Error updating pomodoro settings:", err);
    }
  };

  // Dot indicator component
  const SessionIndicators = () => {
    const sessionSequence = generateSessionSequence();
    const currentSessionIndex =
      (currentCycle - 1) * 2 + (currentSessionType === "focus" ? 0 : 1);

    const getSessionDisplayName = (
      type: SessionType,
      cycleNum?: number
    ): string => {
      switch (type) {
        case "focus":
          return `Focus Session (Cycle ${cycleNum})`;
        case "shortBreak":
          return "Short Break";
        case "longBreak":
          return "Long Break";
        default:
          return "Session";
      }
    };

    return (
      <div className="flex items-center justify-center space-x-3 mb-6">
        {sessionSequence.map((session, index) => {
          const isCurrent = index === currentSessionIndex;
          const isCompleted = session.completed;
          const isNext = index === currentSessionIndex + 1;
          const cycleNumber = Math.floor(index / 2) + 1;

          return (
            <div
              key={index}
              className={`group relative w-4 h-4 rounded-full transition-all duration-300 cursor-help ${
                isCompleted
                  ? session.type === "focus"
                    ? "bg-primary"
                    : session.type === "longBreak"
                    ? "bg-purple-500"
                    : "bg-blue-500"
                  : isCurrent
                  ? session.type === "focus"
                    ? "bg-primary/80 ring-2 ring-primary/30 scale-110"
                    : session.type === "longBreak"
                    ? "bg-purple-500/80 ring-2 ring-purple-500/30 scale-110"
                    : "bg-blue-500/80 ring-2 ring-blue-500/30 scale-110"
                  : isNext
                  ? "bg-muted-foreground/60 scale-105"
                  : "bg-muted/60"
              }`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {getSessionDisplayName(
                  session.type,
                  session.type === "focus" ? cycleNumber : undefined
                )}{" "}
                -{" "}
                {isCompleted
                  ? "Completed"
                  : isCurrent
                  ? "Current"
                  : isNext
                  ? "Next"
                  : "Upcoming"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-popover"></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your pomodoro data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-medium">Error</div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Pomodoro Timer</h1>
          <p className="text-lg text-muted-foreground">
            Stay focused and productive
          </p>
        </div>

        {/* Timer Display */}
        <Card className="p-8 sm:p-12 bg-card text-card-foreground rounded-xl shadow-lg border">
          <CardContent className="text-center space-y-6 sm:space-y-8">
            {/* Session Indicators */}
            <SessionIndicators />

            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight">
              {formatTime(timeLeft)}
            </div>

            {/* Subject display - only for focus sessions */}
            {currentSessionType === "focus" && (
              <div className="text-sm text-muted-foreground">
                Currently studying:{" "}
                <span className="font-medium text-primary">
                  {currentSubject}
                </span>
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 sm:space-x-4">
              <Button
                variant="outline"
                onClick={handlePlayPause}
                className="rounded-lg px-6 py-2 transition-all duration-200 hover:scale-105"
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">{getButtonText()}</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-lg px-6 py-2 transition-all duration-200 hover:scale-105"
              >
                <span className="text-sm sm:text-base">Reset All</span>
              </Button>
            </div>

            {/* Subject Selection - only show during focus sessions */}
            {currentSessionType === "focus" &&
              subjects &&
              subjects.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="flex items-center space-x-2">
                    <Book className="w-4 h-4 text-muted-foreground" />
                    <Select
                      value={currentSubject}
                      onValueChange={setCurrentSubject}
                    >
                      <SelectTrigger className="w-48 border border-border rounded-lg bg-background text-foreground px-3 py-2 transition-colors hover:bg-accent/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground rounded-lg shadow-lg border">
                        {subjects.map((subject) => (
                          <SelectItem
                            key={subject.id}
                            value={subject.name}
                            className="px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors"
                          >
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Subject Manager */}
                  <SubjectManager
                    subjects={subjects}
                    updateSubjects={updateSubjects}
                    deleteSubject={deleteSubject}
                  />
                </div>
              )}

            {/* Break session message */}
            {currentSessionType !== "focus" && (
              <div className="text-center space-y-3 max-w-md mx-auto">
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  {currentSessionType === "shortBreak"
                    ? "Take a short break! Stretch, hydrate, or step away from your screen."
                    : "Time for a long break! Go for a walk, have a snack, or do something refreshing."}
                </p>
                {currentCycle < (pomodoroSettings?.iterations || 1) && (
                  <p className="text-sm text-muted-foreground/70">
                    Next: Focus Session (Cycle {currentCycle + 1})
                  </p>
                )}
                {currentCycle >= (pomodoroSettings?.iterations || 1) && (
                  <p className="text-sm text-primary font-medium">
                    All cycles completed! Great work!
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setPomodoroSettingsOpen(true)}
            className="rounded-lg px-6 py-2 transition-colors hover:bg-accent/80"
          >
            <Settings className="w-4 h-4 mr-2" />
            Timer Settings
          </Button>
        </div>

        {/* Pomodoro Settings Modal */}
        <PomodoroSettings
          isOpen={pomodoroSettingsOpen}
          onClose={() => setPomodoroSettingsOpen(false)}
          settings={pomodoroSettings}
          updateSettings={handleUpdatePomodoroSettings}
        />
      </div>

      {/* Fullscreen Timer Overlay */}
      <FullscreenTimerOverlay
        isOpen={fullscreenOverlayOpen}
        timeLeft={timeLeft}
        currentSubject={currentSubject}
        sessionType={currentSessionType}
        currentCycle={currentCycle}
        sessionSequence={generateSessionSequence()}
        currentSessionIndex={
          (currentCycle - 1) * 2 + (currentSessionType === "focus" ? 0 : 1)
        }
        timerRunning={timerRunning}
        onToggleTimer={handleOverlayToggleTimer}
        onReset={handleOverlayReset}
        onClose={handleCloseOverlay}
      />
    </>
  );
}
