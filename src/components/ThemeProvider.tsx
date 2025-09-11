"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme =
  | "light"
  | "dark"
  | "doom"
  | "cozy"
  | "nature"
  | "cyberpunk"
  | "amethyst";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme;
    const validThemes: Theme[] = [
      "light",
      "dark",
      "doom",
      "cozy",
      "nature",
      "cyberpunk",
      "amethyst",
    ];
    const initial = saved && validThemes.includes(saved) ? saved : "light";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (t: Theme) => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      "dark",
      "doom",
      "cozy",
      "nature",
      "cyberpunk",
      "amethyst"
    );

    // Apply the selected theme class (light is the default, no class needed)
    if (t !== "light") {
      document.documentElement.classList.add(t);
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
