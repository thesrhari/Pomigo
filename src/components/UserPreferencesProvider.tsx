"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Theme } from "@/components/ThemeProvider";
import { useProStatus } from "@/lib/hooks/useProStatus";
import { useUser } from "@/lib/hooks/useUser";

// --- Type Definitions ---
export type TimerStyle = "digital" | "ring" | "progress-bar" | "split-flap";

// --- Constants ---
const defaultTheme: Theme = "light";
const allThemes: Theme[] = [
  "light",
  "dark",
  "ocean",
  "doom",
  "cozy",
  "nature",
  "cyberpunk",
  "amethyst",
  "grove",
];
const proThemes: Theme[] = [
  "ocean",
  "doom",
  "cozy",
  "nature",
  "cyberpunk",
  "amethyst",
  "grove",
];

const defaultStyle: TimerStyle = "digital";
const allStyles: TimerStyle[] = [
  "digital",
  "ring",
  "progress-bar",
  "split-flap",
];
const proStyles: TimerStyle[] = ["ring", "progress-bar", "split-flap"];

// --- Context Shape ---
interface UserPreferencesContextType {
  theme: Theme;
  applyTheme: (newTheme: Theme) => void;
  timerStyle: TimerStyle;
  applyTimerStyle: (newStyle: TimerStyle) => void;
  isUpdating: boolean;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

// --- Provider Component ---
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { isPro, isLoading: isProStatusLoading } = useProStatus();
  const { isLoading: isUserLoading } = useUser();
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [timerStyle, setTimerStyle] = useState<TimerStyle>(defaultStyle); // Add timerStyle state

  // Load and validate all preferences from localStorage on initial render
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme;
    if (storedTheme && allThemes.includes(storedTheme)) {
      setTheme(storedTheme);
    }

    const storedTimerStyle = localStorage.getItem("timerStyle") as TimerStyle;
    if (storedTimerStyle && allStyles.includes(storedTimerStyle)) {
      setTimerStyle(storedTimerStyle);
    }
  }, []);

  // Revert Pro preferences if user is not Pro
  useEffect(() => {
    if (!isProStatusLoading && !isPro && !isUserLoading) {
      let updated = false;
      let newTheme = theme;
      let newStyle = timerStyle;

      if (proThemes.includes(theme)) {
        newTheme = defaultTheme;
        updated = true;
      }
      if (proStyles.includes(timerStyle)) {
        newStyle = defaultStyle;
        updated = true;
      }

      if (updated) {
        setTheme(newTheme);
        setTimerStyle(newStyle);
        localStorage.setItem("theme", newTheme);
        localStorage.setItem("timerStyle", newStyle);
      }
    }
  }, [isPro, isProStatusLoading, isUserLoading]);

  // Function to apply a new theme
  const applyTheme = (newTheme: Theme) => {
    if (!isPro && proThemes.includes(newTheme)) return;
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Function to apply a new timer style
  const applyTimerStyle = (newStyle: TimerStyle) => {
    if (!isPro && proStyles.includes(newStyle)) return;
    setTimerStyle(newStyle);
    localStorage.setItem("timerStyle", newStyle);
  };

  // The value provided to consuming components
  const value = {
    theme,
    applyTheme,
    timerStyle,
    applyTimerStyle,
    isLoading: isProStatusLoading,
    isUpdating: false,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

// --- Custom Hook ---
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}
