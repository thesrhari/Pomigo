"use client";

import { createContext, useContext, useEffect } from "react";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { usePreview } from "@/components/PreviewProvider";

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
  const { theme, applyTheme: setTheme } = useUserPreferences();
  const { isPreviewMode, previewTheme } = usePreview();

  // Apply theme to DOM - respects preview mode
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

    // Use preview theme if in preview mode, otherwise use regular theme
    const activeTheme = isPreviewMode && previewTheme ? previewTheme : theme;
    applyThemeToDOM(activeTheme);
  }, [theme, isPreviewMode, previewTheme]);

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
