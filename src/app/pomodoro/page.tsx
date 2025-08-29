"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import { PomodoroSettings } from "@/components/features/PomodoroSettings";
import { SubjectManager } from "@/components/features/SubjectManager";
import { Play, Pause, Settings, Book } from "lucide-react";

export default function PomodoroPage() {
  const {
    timerRunning,
    timeLeft,
    currentSubject,
    subjects,
    pomodoroSettings,
    setTimerRunning,
    setTimeLeft,
    setCurrentSubject,
    updateSubjects,
    updatePomodoroSettings,
  } = useStore();

  const [pomodoroSettingsOpen, setPomodoroSettingsOpen] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft, setTimeLeft, setTimerRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
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
          <div className="text-8xl font-bold">{formatTime(timeLeft)}</div>

          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setTimerRunning(!timerRunning)}
            >
              {timerRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTimeLeft(pomodoroSettings.focusTime * 60);
                setTimerRunning(false);
              }}
            >
              Reset
            </Button>
          </div>

          {/* Subject Selection */}
          <div className="flex items-center justify-center space-x-2">
            <Book className="w-5 h-5 text-muted-foreground" />
            <Select value={currentSubject} onValueChange={setCurrentSubject}>
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
                    {subject.icon} {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Currently studying:{" "}
            <span className="font-medium text-primary">{currentSubject}</span>
          </div>
        </CardContent>
      </Card>

      {/* Settings Button */}
      <div className="text-center">
        <Button variant="outline" onClick={() => setPomodoroSettingsOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Timer Settings
        </Button>
      </div>

      {/* Subject Manager */}
      <div className="text-center">
        <SubjectManager subjects={subjects} updateSubjects={updateSubjects} />
      </div>

      {/* Pomodoro Settings Modal */}
      <PomodoroSettings
        isOpen={pomodoroSettingsOpen}
        onClose={() => setPomodoroSettingsOpen(false)}
        settings={pomodoroSettings}
        updateSettings={updatePomodoroSettings}
      />
    </div>
  );
}
