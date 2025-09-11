"use client";

import { createContext, useContext, useEffect } from "react";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";

type Theme =
  | "light"
  | "dark"
  | "ocean"
  | "doom"
  | "cozy"
  | "nature"
  | "cyberpunk"
  | "amethyst"
  | "grove";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The useUserPreferences hook provides the theme state.
  // It loads from local storage first, then validates with the DB.
  // We alias `applyTheme` to `setTheme` for the context provider.
  const { theme, applyTheme: setTheme } = useUserPreferences();

  // This effect is now only responsible for the DOM side-effect of applying the theme class.
  // It runs whenever the `theme` state changes, ensuring immediate application.
  useEffect(() => {
    const applyThemeToDOM = (t: Theme) => {
      const validThemes: Theme[] = [
        "dark",
        "ocean",
        "doom",
        "cozy",
        "nature",
        "cyberpunk",
        "amethyst",
        "grove",
      ];
      // Remove all possible theme classes first for a clean slate.
      document.documentElement.classList.remove(...validThemes);

      // Add the new theme class if it's not the default 'light' theme.
      if (t !== "light") {
        document.documentElement.classList.add(t);
      }
    };

    applyThemeToDOM(theme);
  }, [theme]); // This effect now only depends on `theme`.

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setTheme || (() => {}) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export type { Theme };
