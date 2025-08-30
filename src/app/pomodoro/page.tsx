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
  const [currentSubject, setCurrentSubject] = useState("");
  const [pomodoroSettingsOpen, setPomodoroSettingsOpen] = useState(false);
  const [fullscreenOverlayOpen, setFullscreenOverlayOpen] = useState(false);

  // Track if timer was manually paused vs reset/stopped
  const isPausedRef = useRef(false);
  const previousFocusTimeRef = useRef(0);

  // Initialize timer when pomodoroSettings loads
  useEffect(() => {
    if (pomodoroSettings && timeLeft === 0 && !timerRunning) {
      setTimeLeft(pomodoroSettings.focusTime * 60);
      previousFocusTimeRef.current = pomodoroSettings.focusTime;
    }
  }, [pomodoroSettings, timeLeft, timerRunning]);

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
    } else if (timeLeft === 0) {
      setTimerRunning(false);
      setFullscreenOverlayOpen(false); // Close overlay when timer completes
      isPausedRef.current = false; // Timer completed naturally
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft]);

  // Update timer when focus time setting changes (only if not paused)
  useEffect(() => {
    if (!pomodoroSettings) return;

    const focusTimeChanged =
      previousFocusTimeRef.current !== pomodoroSettings.focusTime;

    if (focusTimeChanged && !timerRunning && !isPausedRef.current) {
      setTimeLeft(pomodoroSettings.focusTime * 60);
    }

    previousFocusTimeRef.current = pomodoroSettings.focusTime;
  }, [pomodoroSettings?.focusTime, timerRunning]);

  usePomodoroTracker({
    timerRunning,
    timeLeft,
    focusDuration: pomodoroSettings?.focusTime,
    currentSubject,
  });

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
      if (timeLeft === (pomodoroSettings?.focusTime * 60 || 1500)) {
        setFullscreenOverlayOpen(true);
      }
    }
  };

  const handleReset = () => {
    setTimeLeft(pomodoroSettings?.focusTime * 60 || 1500);
    setTimerRunning(false);
    setFullscreenOverlayOpen(false); // Close overlay when resetting
    isPausedRef.current = false; // Reset paused state
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
    setTimeLeft(pomodoroSettings?.focusTime * 60 || 1500);
    setTimerRunning(false);
    isPausedRef.current = false;
    // Overlay will close via onClose callback
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
        <Card className="p-12 bg-card text-card-foreground rounded-lg shadow-md">
          <CardContent className="text-center space-y-8">
            <div className="text-sm text-muted-foreground">
              Currently studying:{" "}
              <span className="font-medium text-primary">{currentSubject}</span>
            </div>
            <div className="text-8xl font-bold">{formatTime(timeLeft)}</div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePlayPause}>
                {timerRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {getButtonText()}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>

            {/* Subject Selection */}
            {subjects && subjects.length > 0 && (
              <div className="flex items-center justify-center space-x-2">
                <Book className="w-5 h-5 text-muted-foreground" />
                <Select
                  value={currentSubject}
                  onValueChange={setCurrentSubject}
                >
                  <SelectTrigger className="w-48 border border-border rounded-md bg-background text-foreground px-3 py-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground rounded-md shadow-md">
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject.id}
                        value={subject.name}
                        className="px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                      >
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Subject Manager */}
                <div className="text-center">
                  <SubjectManager
                    subjects={subjects}
                    updateSubjects={updateSubjects}
                    deleteSubject={deleteSubject}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setPomodoroSettingsOpen(true)}
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
        timerRunning={timerRunning}
        onToggleTimer={handleOverlayToggleTimer}
        onReset={handleOverlayReset}
        onClose={handleCloseOverlay}
      />
    </>
  );
}
