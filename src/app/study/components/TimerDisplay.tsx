import { TimerMode } from "./PomodoroTimer";

interface TimerDisplayProps {
  timeLeft: number;
  mode: TimerMode;
  progress: number;
  style: "digital" | "circular";
  enlarged?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  mode,
  progress,
  style,
  enlarged = false,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getModeLabel = (mode: TimerMode): string => {
    switch (mode) {
      case "work":
        return "Work Session";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
    }
  };

  const getModeColor = (mode: TimerMode): string => {
    switch (mode) {
      case "work":
        return "text-primary"; // Coral color for work
      case "shortBreak":
        return "text-success"; // Mint green for short break
      case "longBreak":
        return "text-accent"; // Deep teal for long break
    }
  };

  if (style === "digital") {
    return (
      <div
        className={`text-center bg-card rounded-3xl shadow-lg border border-border/50 transition-all duration-500 ${
          enlarged ? "p-24" : "p-12"
        }`}
      >
        <div
          className={`font-medium mb-4 transition-all duration-500 ${
            enlarged ? "text-xl mb-8" : "text-sm"
          } ${getModeColor(mode)}`}
        >
          {getModeLabel(mode)}
        </div>
        <div
          className={`font-mono font-light text-foreground tracking-tight transition-all duration-500 ${
            enlarged ? "text-[12rem] leading-none" : "text-8xl"
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>
    );
  }

  // Circular style
  const size = enlarged ? 480 : 280;
  const strokeWidth = enlarged ? 14 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="text-center">
      <div
        className={`font-medium transition-all duration-500 ${
          enlarged ? "text-xl mb-12" : "text-sm mb-6"
        } ${getModeColor(mode)}`}
      >
        {getModeLabel(mode)}
      </div>

      <div className="relative inline-block transition-all duration-500">
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 transition-all duration-500"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={
              mode === "work"
                ? "var(--primary)"
                : mode === "shortBreak"
                ? "var(--success)"
                : "var(--accent)"
            }
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: enlarged
                ? "stroke-dashoffset 1s ease-in-out, stroke-width 0.5s ease-out"
                : "stroke-dashoffset 1s ease-in-out",
            }}
          />
        </svg>

        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`font-mono font-light text-foreground tracking-tight transition-all duration-500 ${
              enlarged ? "text-8xl leading-none" : "text-6xl"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
};
