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

  // Get session-specific styling and content
  const getSessionConfig = () => {
    switch (sessionType) {
      case "focus":
        return {
          bgClass: "bg-background",
          textClass: "text-foreground",
          title: "Focus Session",
          subtitle: currentSubject
            ? `Studying: ${currentSubject}`
            : "Focus Time",
        };
      case "shortBreak":
        return {
          bgClass: "bg-blue-50 dark:bg-blue-950/20",
          textClass: "text-blue-900 dark:text-blue-100",
          title: "Short Break",
          subtitle: "Take a quick breather",
        };
      case "longBreak":
        return {
          bgClass: "bg-purple-50 dark:bg-purple-950/20",
          textClass: "text-purple-900 dark:text-purple-100",
          title: "Long Break",
          subtitle: "Time to recharge",
        };
      default:
        return {
          bgClass: "bg-background",
          textClass: "text-foreground",
          title: "Focus Session",
          subtitle: currentSubject
            ? `Studying: ${currentSubject}`
            : "Focus Time",
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
      <div className="flex items-center justify-center space-x-3 mb-8">
        {sessionSequence.map((session, index) => {
          const isCurrent = index === currentSessionIndex;
          const isCompleted = session.completed;
          const isNext = index === currentSessionIndex + 1;
          const cycleNumber = Math.floor(index / 2) + 1;

          return (
            <div
              key={index}
              className={`group relative w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 cursor-help ${
                isCompleted
                  ? session.type === "focus"
                    ? "bg-primary"
                    : session.type === "longBreak"
                    ? "bg-purple-500"
                    : "bg-blue-500"
                  : isCurrent
                  ? session.type === "focus"
                    ? "bg-primary/80 ring-2 ring-primary/30 scale-125"
                    : session.type === "longBreak"
                    ? "bg-purple-500/80 ring-2 ring-purple-500/30 scale-125"
                    : "bg-blue-500/80 ring-2 ring-blue-500/30 scale-125"
                  : isNext
                  ? "bg-muted-foreground/60 scale-110"
                  : "bg-muted/40"
              }`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-background/95 backdrop-blur-sm text-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border">
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
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-background/95"></div>
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

    // Clear existing timeouts
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (hideCursorTimeoutRef.current) {
      clearTimeout(hideCursorTimeoutRef.current);
    }

    // Hide controls after 3 seconds of no mouse movement
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    // Hide cursor after 2 seconds of no mouse movement
    hideCursorTimeoutRef.current = setTimeout(() => {
      setCursorVisible(false);
    }, 2000);
  };

  const handleToggleTimer = () => {
    onToggleTimer();
    // Keep overlay open when toggling timer
  };

  const handleReset = () => {
    onReset();
    onClose(); // Close overlay when resetting
  };

  // Handle escape key to close overlay
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space bar to pause/unpause
      if (event.key === " ") {
        event.preventDefault();
        onToggleTimer();
      }
      // Escape key to close overlay
      if (event.key === "Escape") {
        onClose();
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

  // Reset control visibility when overlay opens
  useEffect(() => {
    if (isOpen) {
      setShowControls(true);
      setCursorVisible(true);

      // Set initial timeout
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);

      hideCursorTimeoutRef.current = setTimeout(() => {
        setCursorVisible(false);
      }, 2000);
    }

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (hideCursorTimeoutRef.current) {
        clearTimeout(hideCursorTimeoutRef.current);
      }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed inset-0 z-50 ${
            sessionConfig.bgClass
          } flex items-center justify-center transition-colors duration-500 ${
            cursorVisible ? "cursor-default" : "cursor-none"
          }`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setShowControls(false);
            setCursorVisible(false);
          }}
        >
          {/* Main Timer Display */}
          <div className="text-center space-y-6 sm:space-y-8 select-none px-4">
            {/* Session Indicators */}
            <OverlaySessionIndicators />

            {/* Session Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="space-y-2"
            >
              <div
                className={`text-sm sm:text-base font-medium ${sessionConfig.textClass}/80`}
              >
                {sessionConfig.title}
                {sessionType === "focus" && (
                  <span className="ml-2 text-xs opacity-70">
                    (Cycle {currentCycle})
                  </span>
                )}
              </div>
            </motion.div>

            {/* Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold ${sessionConfig.textClass} tracking-tight leading-none`}
            >
              {formatTime(timeLeft)}
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`text-sm sm:text-base md:text-lg ${sessionConfig.textClass}/70 max-w-md mx-auto`}
            >
              {sessionConfig.subtitle}
            </motion.div>
          </div>

          {/* Controls that appear on mouse movement */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 sm:space-x-4"
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleTimer}
                  className="bg-background/80 backdrop-blur-sm border-border hover:bg-accent hover:text-accent-foreground"
                >
                  {timerRunning ? (
                    <Pause className="w-5 h-5 mr-2" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {timerRunning ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="bg-background/80 backdrop-blur-sm border-border hover:bg-accent hover:text-accent-foreground"
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
                className="absolute top-6 sm:top-8 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm text-muted-foreground/80 bg-background/70 backdrop-blur-md px-4 py-2 rounded-lg border"
              >
                <span className="hidden sm:inline">Press </span>
                <kbd className="px-2 py-1 bg-muted/80 rounded text-xs font-mono">
                  SPACE
                </kbd>
                <span className="hidden sm:inline"> to pause/resume • </span>
                <span className="sm:hidden"> • </span>
                <kbd className="px-2 py-1 bg-muted/80 rounded text-xs font-mono">
                  ESC
                </kbd>
                <span className="hidden sm:inline"> to exit</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
