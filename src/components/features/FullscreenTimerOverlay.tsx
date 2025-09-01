import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SessionType = "focus" | "shortBreak" | "longBreak";

interface SessionStatus {
  type: SessionType;
  completed: boolean;
}

interface FullscreenTimerOverlayProps {
  isOpen: boolean;
  timeLeft: number;
  currentSubject: string;
  sessionType: SessionType;
  currentCycle: number;
  sessionSequence: SessionStatus[];
  currentSessionIndex: number;
  timerRunning: boolean;
  onToggleTimer: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const FullscreenTimerOverlay: React.FC<FullscreenTimerOverlayProps> = ({
  isOpen,
  timeLeft,
  currentSubject,
  sessionType,
  currentCycle,
  sessionSequence,
  currentSessionIndex,
  timerRunning,
  onToggleTimer,
  onReset,
  onClose,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideCursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get session-specific styling and content using only theme variables
  const getSessionConfig = () => {
    switch (sessionType) {
      case "focus":
        return {
          bgClass: "bg-background",
          textClass: "text-foreground",
          title: "Focus",
          subtitle: currentSubject
            ? `Studying: ${currentSubject}`
            : "Time to focus",
        };
      case "shortBreak":
        return {
          bgClass: "bg-gradient-to-br from-background to-secondary",
          textClass: "text-secondary-foreground",
          title: "Short Break",
          subtitle: "A quick breather.",
        };
      case "longBreak":
        return {
          bgClass: "bg-gradient-to-br from-background to-accent",
          textClass: "text-accent-foreground",
          title: "Long Break",
          subtitle: "Time to recharge.",
        };
      default:
        return {
          bgClass: "bg-background",
          textClass: "text-foreground",
          title: "Focus",
          subtitle: "Focus Session",
        };
    }
  };

  const sessionConfig = getSessionConfig();

  // Dot indicator component for overlay
  const OverlaySessionIndicators = () => {
    const getSessionDisplayName = (
      type: SessionType,
      cycleNum?: number
    ): string => {
      switch (type) {
        case "focus":
          return `Focus (Cycle ${cycleNum})`;
        case "shortBreak":
          return "Short Break";
        case "longBreak":
          return "Long Break";
        default:
          return "Session";
      }
    };

    // Refactored indicator classes to use theme variables and improve readability
    const indicatorClasses = {
      base: "group relative w-3 h-3 rounded-full transition-all duration-300 cursor-help",
      status: {
        focus: {
          completed: "bg-primary",
          current: "bg-primary/80 ring-2 ring-primary/30 scale-125",
        },
        shortBreak: {
          completed: "bg-secondary-foreground",
          current:
            "bg-secondary-foreground/80 ring-2 ring-secondary-foreground/30 scale-125",
        },
        longBreak: {
          completed: "bg-accent-foreground",
          current:
            "bg-accent-foreground/80 ring-2 ring-accent-foreground/30 scale-125",
        },
        next: "bg-muted-foreground/20",
        upcoming: "bg-muted-foreground/20",
      },
    };

    return (
      <div className="flex items-center justify-center space-x-3 mb-8">
        {sessionSequence.map((session, index) => {
          const isCurrent = index === currentSessionIndex;
          const isCompleted = session.completed;
          const isNext = index === currentSessionIndex + 1;
          const cycleNumber = Math.floor(index / 2) + 1;

          const getIndicatorClass = () => {
            if (isCompleted)
              return indicatorClasses.status[session.type].completed;
            if (isCurrent) return indicatorClasses.status[session.type].current;
            if (isNext) return indicatorClasses.status.next;
            return indicatorClasses.status.upcoming;
          };

          return (
            <div
              key={index}
              className={`${indicatorClasses.base} ${getIndicatorClass()}`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border">
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
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-t-4 border-transparent border-t-popover"></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleMouseMove = () => {
    setShowControls(true);
    setCursorVisible(true);

    if (hideControlsTimeoutRef.current)
      clearTimeout(hideControlsTimeoutRef.current);
    if (hideCursorTimeoutRef.current)
      clearTimeout(hideCursorTimeoutRef.current);

    hideControlsTimeoutRef.current = setTimeout(
      () => setShowControls(false),
      3000
    );
    hideCursorTimeoutRef.current = setTimeout(
      () => setCursorVisible(false),
      2000
    );
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
        onToggleTimer();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onToggleTimer, onClose, isOpen]);

  // Disable body scroll when overlay is visible
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset control visibility when overlay opens/closes
  useEffect(() => {
    if (isOpen) {
      handleMouseMove(); // Trigger initial show
    }
    return () => {
      if (hideControlsTimeoutRef.current)
        clearTimeout(hideControlsTimeoutRef.current);
      if (hideCursorTimeoutRef.current)
        clearTimeout(hideCursorTimeoutRef.current);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 ${
            sessionConfig.bgClass
          } ${cursorVisible ? "cursor-default" : "cursor-none"}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setShowControls(false);
            setCursorVisible(false);
          }}
        >
          {/* Main Timer Display */}
          <div className="text-center space-y-8 select-none px-4">
            <OverlaySessionIndicators />

            {/* Timer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className={`text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-bold ${sessionConfig.textClass} tracking-tight leading-none`}
            >
              {formatTime(timeLeft)}
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              className={`text-base md:text-lg opacity-60 ${sessionConfig.textClass} max-w-md mx-auto`}
            >
              {sessionConfig.subtitle}
            </motion.div>
          </div>

          {/* Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-8 flex items-center space-x-4"
              >
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onToggleTimer}
                  className="bg-background/50 text-foreground backdrop-blur-sm border rounded-full h-12 px-6 hover:bg-background/75"
                >
                  {timerRunning ? (
                    <Pause className="w-5 h-5 mr-2" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {timerRunning ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onReset}
                  className="bg-background/50 text-foreground backdrop-blur-sm border rounded-full h-12 px-6 hover:bg-background/75"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset & Exit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="absolute top-8 text-sm text-muted-foreground/80 bg-background/70 backdrop-blur-md px-4 py-2 rounded-lg border"
              >
                Press{" "}
                <kbd className="px-2 py-1 bg-muted/80 rounded text-xs font-mono">
                  SPACE
                </kbd>{" "}
                to toggle timer
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
