import React from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface TimerComponentProps {
  timeLeft: number;
  totalTime: number;
  sessionType: "study" | "short_break" | "long_break";
  currentSubject?: string;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Default Digital Timer Component
export const DigitalTimer: React.FC<TimerComponentProps> = ({
  timeLeft,
  sessionType,
  currentSubject,
  className = "",
}) => {
  const getSessionConfig = () => {
    switch (sessionType) {
      case "study":
        return {
          textClass: "text-foreground",
          title: "Focus",
          subtitle: currentSubject ? `${currentSubject}` : "Time to focus",
        };
      case "short_break":
        return {
          textClass: "text-secondary-foreground",
          title: "Short Break",
          subtitle: "A quick breather.",
        };
      case "long_break":
        return {
          textClass: "text-accent-foreground",
          title: "Long Break",
          subtitle: "Time to recharge.",
        };
      default:
        return {
          textClass: "text-foreground",
          title: "Focus",
          subtitle: "Focus Session",
        };
    }
  };

  const sessionConfig = getSessionConfig();

  return (
    <div className={`text-center space-y-8 select-none ${className}`}>
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
        className="text-base md:text-lg opacity-60 text-foreground/50 max-w-md mx-auto"
      >
        {sessionType === "study" && "Studying: "}
        <span
          className={sessionType === "study" ? "text-primary/60" : undefined}
        >
          {sessionConfig.subtitle}
        </span>
      </motion.div>
    </div>
  );
};

// Ring Timer Component
export const RingTimer: React.FC<TimerComponentProps> = ({
  timeLeft,
  totalTime,
  sessionType,
  currentSubject,
  className = "",
}) => {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 250;
  const strokeWidth = 16;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getSessionConfig = () => {
    switch (sessionType) {
      case "study":
        return {
          ringColor: "stroke-primary",
          textClass: "text-foreground",
          subtitle: currentSubject ? `${currentSubject}` : "Time to focus",
        };
      case "short_break":
        return {
          ringColor: "stroke-secondary-foreground",
          textClass: "text-secondary-foreground",
          subtitle: "A quick breather.",
        };
      case "long_break":
        return {
          ringColor: "stroke-accent-foreground",
          textClass: "text-accent-foreground",
          subtitle: "Time to recharge.",
        };
      default:
        return {
          ringColor: "stroke-primary",
          textClass: "text-foreground",
          subtitle: "Focus Session",
        };
    }
  };

  const sessionConfig = getSessionConfig();

  return (
    <div
      className={`text-center space-y-8 select-none flex flex-col items-center ${className}`}
    >
      {/* Ring Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <svg
          width={radius * 2}
          height={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeWidth={strokeWidth}
            className="stroke-muted-foreground/20 fill-transparent"
          />
          {/* Progress ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeWidth={strokeWidth}
            className={`${sessionConfig.ringColor} fill-transparent transition-all duration-1000 ease-linear`}
            style={{
              strokeDasharray,
              strokeDashoffset,
              strokeLinecap: "round",
            }}
          />
        </svg>

        {/* Time display in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`text-8xl font-bold ${sessionConfig.textClass} tracking-tight`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        className="text-base md:text-lg opacity-60 text-foreground/50 max-w-md mx-auto"
      >
        {sessionType === "study" && "Studying: "}
        <span
          className={sessionType === "study" ? "text-primary/60" : undefined}
        >
          {sessionConfig.subtitle}
        </span>
      </motion.div>
    </div>
  );
};

// Horizontal Progress Bar Timer Component
export const ProgressBarTimer: React.FC<TimerComponentProps> = ({
  timeLeft,
  totalTime,
  sessionType,
  currentSubject,
  className = "",
}) => {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      width: `${progress}%`,
      transition: { duration: 0.5, ease: "linear" },
    });
  }, [progress, controls]);

  const getSessionConfig = () => {
    switch (sessionType) {
      case "study":
        return {
          barColor: "bg-primary",
          textClass: "text-foreground",
          subtitle: currentSubject ? `${currentSubject}` : "Time to focus",
        };
      case "short_break":
        return {
          barColor: "bg-secondary-foreground",
          textClass: "text-secondary-foreground",
          subtitle: "A quick breather.",
        };
      case "long_break":
        return {
          barColor: "bg-accent-foreground",
          textClass: "text-accent-foreground",
          subtitle: "Time to recharge.",
        };
      default:
        return {
          barColor: "bg-primary",
          textClass: "text-foreground",
          subtitle: "Focus Session",
        };
    }
  };

  const sessionConfig = getSessionConfig();

  return (
    <div
      className={`text-center space-y-8 select-none w-full px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className={`text-5xl sm:text-6xl font-bold ${sessionConfig.textClass} tracking-tight leading-none`}
      >
        {formatTime(timeLeft)}
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="space-y-3"
      >
        <div className="w-full h-8 bg-muted-foreground/10 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className={`h-full ${sessionConfig.barColor} rounded-full shadow-sm`}
            initial={{ width: "0%" }}
            animate={controls}
            variants={{
              flicker: {
                width: [`${progress}%`, `${progress - 1}%`, `${progress}%`],
                transition: { duration: 0.2, repeat: Infinity },
              },
            }}
          />
        </div>

        {/* Progress info */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>0:00</span>
          <span
            className={`font-semibold ${sessionConfig.textClass} opacity-80`}
          >
            {Math.round(progress)}% Complete
          </span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        className="text-base md:text-lg opacity-60 text-foreground/50 max-w-md mx-auto !mt-12"
      >
        {sessionType === "study" && "Studying: "}
        <span
          className={sessionType === "study" ? "text-primary/60" : undefined}
        >
          {sessionConfig.subtitle}
        </span>
      </motion.div>
    </div>
  );
};

// Split Flap Digit Component
const SplitFlapDigit: React.FC<{ currentDigit: string; prevDigit: string }> = ({
  currentDigit,
  prevDigit,
}) => {
  return (
    <div className="relative w-16 h-24 sm:w-24 sm:h-36 text-7xl sm:text-9xl font-mono text-card-foreground">
      {/* Top half of the current digit */}
      <div className="absolute w-full h-1/2 top-0 rounded-t-lg flex items-end justify-center overflow-hidden bg-card">
        <span className="transform translate-y-1/2">{currentDigit}</span>
      </div>
      {/* Bottom half of the current digit */}
      <div className="absolute w-full h-1/2 bottom-0 rounded-b-lg flex items-start justify-center overflow-hidden bg-card">
        <span className="transform -translate-y-1/2">{currentDigit}</span>
      </div>

      <AnimatePresence>
        {/* Flipping top half (showing the previous digit) */}
        <motion.div
          key={currentDigit + "top"}
          initial={{ rotateX: 0 }}
          animate={{ rotateX: -90 }}
          exit={{ rotateX: -90 }}
          transition={{ duration: 0.3, ease: "linear" }}
          className="absolute w-full h-1/2 top-0 rounded-t-lg flex items-end justify-center overflow-hidden bg-muted text-muted-foreground"
          style={{
            transformOrigin: "bottom",
            backfaceVisibility: "hidden",
          }}
        >
          <span className="transform translate-y-1/2">{prevDigit}</span>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {/* Flipping bottom half (showing the new digit) */}
        <motion.div
          key={currentDigit + "bottom"}
          initial={{ rotateX: 90 }}
          animate={{ rotateX: 0 }}
          transition={{ duration: 0.3, ease: "linear" }}
          className="absolute w-full h-1/2 bottom-0 rounded-b-lg flex items-start justify-center overflow-hidden bg-card"
          style={{
            transformOrigin: "top",
            backfaceVisibility: "hidden",
          }}
        >
          <span className="transform -translate-y-1/2">{currentDigit}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Split Flap Timer Component
export const SplitFlapTimer: React.FC<TimerComponentProps> = ({
  timeLeft,
  sessionType,
  currentSubject,
  className = "",
}) => {
  const formatTimeForFlap = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return [
      Math.floor(mins / 10).toString(),
      (mins % 10).toString(),
      Math.floor(secs / 10).toString(),
      (secs % 10).toString(),
    ];
  };

  const timeDigits = formatTimeForFlap(timeLeft);
  const prevTimeDigits = formatTimeForFlap(timeLeft + 1);

  const getSessionConfig = () => {
    switch (sessionType) {
      case "study":
        return {
          subtitle: currentSubject ? `${currentSubject}` : "Time to focus",
        };
      case "short_break":
        return {
          subtitle: "A quick breather.",
        };
      case "long_break":
        return {
          subtitle: "Time to recharge.",
        };
      default:
        return {
          subtitle: "Focus Session",
        };
    }
  };

  const sessionConfig = getSessionConfig();

  return (
    <div className={`text-center space-y-8 select-none ${className}`}>
      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4"
      >
        <SplitFlapDigit
          currentDigit={timeDigits[0]}
          prevDigit={prevTimeDigits[0]}
        />
        <SplitFlapDigit
          currentDigit={timeDigits[1]}
          prevDigit={prevTimeDigits[1]}
        />
        <div className="text-6xl sm:text-8xl font-mono text-foreground">:</div>
        <SplitFlapDigit
          currentDigit={timeDigits[2]}
          prevDigit={prevTimeDigits[2]}
        />
        <SplitFlapDigit
          currentDigit={timeDigits[3]}
          prevDigit={prevTimeDigits[3]}
        />
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="text-base md:text-lg opacity-60 text-foreground/50 max-w-md mx-auto"
      >
        {sessionType === "study" && "Studying: "}
        <span
          className={sessionType === "study" ? "text-primary/60" : undefined}
        >
          {sessionConfig.subtitle}
        </span>
      </motion.div>
    </div>
  );
};
