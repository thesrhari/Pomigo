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
import { Play, Pause, Settings, RotateCcw, SkipForward } from "lucide-react";
import { usePomodoroTracker } from "@/lib/hooks/usePomodoroTracker";
import { useSupabaseData } from "@/lib/hooks/useSupabaseData";
import { useAudioNotifications } from "@/lib/hooks/useAudioNotifications";
import { createClient } from "@/lib/supabase/client";
import { PomodoroSkeleton } from "./components/PomodoroSkeleton";

const supabase = createClient();

type SessionType = "study" | "short_break" | "long_break";

interface SessionStatus {
  type: SessionType;
  completed: boolean;
}

interface WorkerMessage {
  command: "start" | "stop";
  duration?: number;
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

  // Audio hook for playing sounds
  const { playSound } = useAudioNotifications();

  // Local state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSubject, setCurrentSubject] = useState("Uncategorized");
  const [pomodoroSettingsOpen, setPomodoroSettingsOpen] = useState(false);
  const [fullscreenOverlayOpen, setFullscreenOverlayOpen] = useState(false);

  // Cycling state
  const [currentSessionType, setCurrentSessionType] =
    useState<SessionType>("study");
  const [currentCycle, setCurrentCycle] = useState(1);
  const [completedSessions, setCompletedSessions] = useState<SessionStatus[]>(
    []
  );

  // Ref to track if the timer was manually paused
  const isPausedRef = useRef(false);
  const previousFocusTimeRef = useRef(0);

  // Web Worker integration
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker("/timer.worker.js");

    // Set up the listener for messages coming FROM the worker
    workerRef.current.onmessage = (
      event: MessageEvent<{ type: string; timeLeft?: number }>
    ) => {
      const { type, timeLeft: workerTimeLeft } = event.data;

      if (type === "tick" && workerTimeLeft !== undefined) {
        setTimeLeft(workerTimeLeft);
      } else if (type === "sessionEnd") {
        // Session-ending logic
        if (pomodoroSettings) {
          playSound(
            pomodoroSettings.selectedSoundId,
            pomodoroSettings.soundEnabled
          );
        }

        setTimerRunning(false);
        setFullscreenOverlayOpen(false);
        isPausedRef.current = false;

        setCompletedSessions((prev) => {
          const newCompleted = [...prev];
          const currentIndex =
            (currentCycle - 1) * 2 + (currentSessionType === "study" ? 0 : 1);
          newCompleted[currentIndex] = {
            type: currentSessionType,
            completed: true,
          };
          return newCompleted;
        });

        const nextSessionType = getNextSessionType();
        if (
          currentCycle >= (pomodoroSettings?.iterations || 1) &&
          currentSessionType !== "study"
        ) {
          return;
        }

        setCurrentSessionType(nextSessionType);

        if (currentSessionType !== "study" && nextSessionType === "study") {
          setCurrentCycle((prev) => prev + 1);
        }

        const nextDuration = getSessionDuration(nextSessionType);
        setTimeLeft(nextDuration * 60);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [pomodoroSettings, playSound, currentCycle, currentSessionType]);

  const isPomodoroSequenceActive =
    currentCycle > 1 ||
    currentSessionType !== "study" ||
    completedSessions.length > 0 ||
    timerRunning ||
    isPausedRef.current;

  // Helper function to get session duration
  const getSessionDuration = (sessionType: SessionType): number => {
    if (!pomodoroSettings) return 25; // Fallback during loading
    switch (sessionType) {
      case "study":
        return pomodoroSettings.focusTime;
      case "short_break":
        return pomodoroSettings.shortBreak;
      case "long_break":
        return pomodoroSettings.longBreak;
      default:
        return 25;
    }
  };

  // Helper function to get next session type
  const getNextSessionType = (): SessionType => {
    if (currentSessionType === "study") {
      if (
        pomodoroSettings?.longBreakEnabled &&
        currentCycle % pomodoroSettings.longBreakInterval === 0
      ) {
        return "long_break";
      }
      return "short_break";
    }
    if (currentCycle >= (pomodoroSettings?.iterations || 1)) {
      handleReset();
    }
    return "study";
  };

  // Generate session sequence for indicators
  const generateSessionSequence = (): SessionStatus[] => {
    if (!pomodoroSettings) return [];

    const sequence: SessionStatus[] = [];
    const totalCycles = pomodoroSettings.iterations;

    for (let cycle = 1; cycle <= totalCycles; cycle++) {
      sequence.push({
        type: "study",
        completed: completedSessions.some(
          (s, i) => i === (cycle - 1) * 2 && s.type === "study" && s.completed
        ),
      });

      const isLongBreak =
        pomodoroSettings.longBreakEnabled &&
        cycle % pomodoroSettings.longBreakInterval === 0;

      sequence.push({
        type: isLongBreak ? "long_break" : "short_break",
        completed: completedSessions.some(
          (s, i) =>
            i === (cycle - 1) * 2 + 1 &&
            s.type === (isLongBreak ? "long_break" : "short_break") &&
            s.completed
        ),
      });
    }
    return sequence;
  };

  // Handle skipping break sessions
  const handleSkipBreak = () => {
    if (currentSessionType === "study") return; // Only allow skipping breaks

    // Explicitly tell the worker to stop its current timer
    workerRef.current?.postMessage({ command: "stop" });

    setTimerRunning(false);
    setFullscreenOverlayOpen(false);
    isPausedRef.current = false;

    setCompletedSessions((prev) => {
      const newCompleted = [...prev];
      const currentIndex = (currentCycle - 1) * 2 + 1;
      newCompleted[currentIndex] = {
        type: currentSessionType,
        completed: true,
      };
      return newCompleted;
    });

    const nextSessionType = getNextSessionType();
    if (currentCycle >= (pomodoroSettings?.iterations || 1)) {
      return;
    }

    setCurrentSessionType(nextSessionType);

    if (nextSessionType === "study") {
      setCurrentCycle((prev) => prev + 1);
    }

    const nextDuration = getSessionDuration(nextSessionType);
    setTimeLeft(nextDuration * 60);
  };

  // Initialize timer when settings load
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

  // Update timer when settings change
  useEffect(() => {
    if (!pomodoroSettings) return;
    const focusTimeChanged =
      previousFocusTimeRef.current !== pomodoroSettings.focusTime;
    if (
      focusTimeChanged &&
      !timerRunning &&
      !isPausedRef.current &&
      currentSessionType === "study"
    ) {
      setTimeLeft(pomodoroSettings.focusTime * 60);
    }
    previousFocusTimeRef.current = pomodoroSettings.focusTime;
  }, [pomodoroSettings?.focusTime, timerRunning, currentSessionType]);

  usePomodoroTracker({
    timeLeft,
    timerRunning,
    sessionType: currentSessionType,
    currentSubject,
    focusDuration: pomodoroSettings?.focusTime || 25,
    shortBreakDuration: pomodoroSettings?.shortBreak || 5,
    longBreakDuration: pomodoroSettings?.longBreak || 15,
  });

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
      // Timer is running, so we want to pause it
      isPausedRef.current = true;
      setTimerRunning(false);
      // Explicitly tell the worker to stop
      workerRef.current?.postMessage({ command: "stop" } as WorkerMessage);
    } else {
      // Timer is paused or stopped, so we want to start it
      isPausedRef.current = false;
      setTimerRunning(true);
      // Tell the worker to start and give it the current duration
      workerRef.current?.postMessage({
        command: "start",
        duration: timeLeft,
      } as WorkerMessage);

      if (timeLeft === getSessionDuration(currentSessionType) * 60) {
        setFullscreenOverlayOpen(true);
      }
    }
  };

  const handleReset = () => {
    // Explicitly tell the worker to stop its current timer
    workerRef.current?.postMessage({ command: "stop" } as WorkerMessage);

    setCurrentSessionType("study");
    setCurrentCycle(1);
    setCompletedSessions([]);
    setTimeLeft((pomodoroSettings?.focusTime || 25) * 60);
    setTimerRunning(false);
    setFullscreenOverlayOpen(false);
    isPausedRef.current = false;
  };

  const handleUpdatePomodoroSettings = async (
    newSettings: typeof pomodoroSettings
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && newSettings) {
        await updatePomodoroSettings(newSettings, user.id);
      }
    } catch (err) {
      console.error("Error updating pomodoro settings:", err);
    }
  };

  // Session Indicators Component
  const SessionIndicators = () => {
    const sessionSequence = generateSessionSequence();
    const currentSessionIndex =
      (currentCycle - 1) * 2 + (currentSessionType === "study" ? 0 : 1);

    const getSessionDisplayName = (
      type: SessionType,
      cycleNum?: number
    ): string => {
      switch (type) {
        case "study":
          return `Focus (Cycle ${cycleNum})`;
        case "short_break":
          return "Short Break";
        case "long_break":
          return "Long Break";
        default:
          return "Session";
      }
    };

    return (
      <div className="flex items-center justify-center space-x-2.5 mb-6">
        {sessionSequence.map((session, index) => {
          const isCurrent = index === currentSessionIndex;
          const isCompleted = session.completed;
          const cycleNumber = Math.floor(index / 2) + 1;

          const baseClasses =
            "group relative w-3 h-3 rounded-full transition-all duration-300 cursor-help";

          const sessionTypeColor = {
            study: "bg-primary ring-primary",
            short_break: "bg-secondary ring-secondary",
            long_break: "bg-accent ring-accent",
          };

          const colorClasses =
            sessionTypeColor[session.type] || "bg-primary ring-primary";
          const [bgColor, ringColor] = colorClasses.split(" ");

          let stateClasses = "";
          if (isCompleted) {
            stateClasses = `${bgColor}`;
          } else if (isCurrent) {
            stateClasses = `bg-opacity-80 ${bgColor} ring-2 ring-offset-2 ring-offset-background ${ringColor} scale-110`;
          } else {
            stateClasses =
              "bg-muted-foreground/20 hover:bg-muted-foreground/50";
          }

          return (
            <div key={index} className={`${baseClasses} ${stateClasses}`}>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {getSessionDisplayName(
                  session.type,
                  session.type === "study" ? cycleNumber : undefined
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-t-4 border-x-transparent border-t-popover"></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Loading and Error States - Show loading until pomodoroSettings is available
  if (loading || !pomodoroSettings) {
    return <PomodoroSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 p-4">
          <div className="text-destructive text-lg font-medium">
            An Error Occurred
          </div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // JSX Return
  return (
    <>
      <div className="max-w-xl mx-auto space-y-8 px-4 py-4">
        <div className="text-center">
          <h1 className="!text-4xl font-bold tracking-tight text-foreground !sm:text-5xl">
            Pomodoro Timer
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:mt-4 !sm:text-lg">
            Stay focused and manage your time effectively.
          </p>
        </div>
        <Card className="bg-card/50 backdrop-blur-sm text-card-foreground rounded-2xl shadow-lg border-border/80">
          <CardContent className="text-center space-y-8 p-6 sm:p-10">
            <SessionIndicators />

            <div className="font-mono text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight text-foreground">
              {formatTime(timeLeft)}
            </div>

            {currentSessionType === "study" &&
              subjects &&
              subjects.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <div className="flex items-center gap-x-2">
                    <span className="text-muted-foreground">Studying:</span>
                    <Select
                      value={currentSubject}
                      onValueChange={setCurrentSubject}
                    >
                      <SelectTrigger className="w-48 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <SubjectManager
                      subjects={subjects}
                      updateSubjects={updateSubjects}
                      deleteSubject={deleteSubject}
                    />
                  </div>
                </div>
              )}

            {currentSessionType !== "study" && (
              <div className="text-center max-w-md mx-auto pt-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {currentSessionType === "short_break"
                    ? "Time for a short break. Stretch, hydrate, or rest your eyes."
                    : "Enjoy a long break. Go for a walk or do something refreshing."}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-1 md:gap-4 mt-12">
              <div className="relative group">
                <Button
                  variant="ghost"
                  className="rounded-full transition-all cursor-pointer"
                  onClick={() => setPomodoroSettingsOpen(true)}
                  disabled={isPomodoroSequenceActive}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                {isPomodoroSequenceActive && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Settings are locked. Reset or complete the session to change
                    settings.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-t-4 border-x-transparent border-t-popover"></div>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                variant="outline"
                onClick={handlePlayPause}
                className="rounded-full w-32 transition-all cursor-pointer"
              >
                {timerRunning ? (
                  <Pause className="w-5 h-5 mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {getButtonText()}
              </Button>

              {currentSessionType !== "study" && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleSkipBreak}
                  className="rounded-full transition-all cursor-pointer"
                  title="Skip break and go to next session"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
              )}

              <Button
                size="lg"
                variant="ghost"
                onClick={handleReset}
                className="rounded-full transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <PomodoroSettings
          isOpen={pomodoroSettingsOpen && !isPomodoroSequenceActive}
          onClose={() => setPomodoroSettingsOpen(false)}
          settings={pomodoroSettings}
          updateSettings={handleUpdatePomodoroSettings}
        />
      </div>

      <FullscreenTimerOverlay
        isOpen={fullscreenOverlayOpen}
        timeLeft={timeLeft}
        currentSubject={currentSubject}
        sessionType={currentSessionType}
        currentCycle={currentCycle}
        sessionSequence={generateSessionSequence()}
        currentSessionIndex={
          (currentCycle - 1) * 2 + (currentSessionType === "study" ? 0 : 1)
        }
        timerRunning={timerRunning}
        onToggleTimer={handlePlayPause}
        onReset={handleReset}
        onClose={() => setFullscreenOverlayOpen(false)}
        onSkip={handleSkipBreak}
      />
    </>
  );
}
