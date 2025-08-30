import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FullscreenTimerOverlayProps {
  isOpen: boolean;
  timeLeft: number;
  currentSubject: string;
  timerRunning: boolean;
  onToggleTimer: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const FullscreenTimerOverlay: React.FC<FullscreenTimerOverlayProps> = ({
  isOpen,
  timeLeft,
  currentSubject,
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
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onToggleTimer]);

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
          className={`fixed inset-0 z-50 bg-background flex items-center justify-center ${
            cursorVisible ? "cursor-default" : "cursor-none"
          }`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setShowControls(false);
            setCursorVisible(false);
          }}
        >
          {/* Main Timer Display */}
          <div className="text-center space-y-8 select-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold text-foreground tracking-tight"
            >
              {formatTime(timeLeft)}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground"
            >
              Studying:{" "}
              <span className="text-primary font-medium">{currentSubject}</span>
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
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4"
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

          {/* Clear instruction about how to exit */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="absolute top-8 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground/80 bg-background/60 backdrop-blur-sm px-4 py-2 rounded-lg"
              >
                Press{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">SPACE</kbd>{" "}
                to pause or resume
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
