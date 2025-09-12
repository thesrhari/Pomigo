"use client";

import { createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { usePreview } from "@/components/PreviewProvider";
import { DynamicFontLoader } from "./DynamicFontLoader";

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

// Define the paths where the light theme should be forced
const lightThemeForcedPaths = ["/", "/login"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, applyTheme: setTheme } = useUserPreferences();
  const { isPreviewMode, previewTheme } = usePreview();
  const pathname = usePathname();

  // Apply theme to DOM - respects preview mode and forces light theme on specific pages
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

    // Force light theme on the specified paths
    if (lightThemeForcedPaths.includes(pathname)) {
      applyThemeToDOM("light");
      return;
    }

    // Use preview theme if in preview mode, otherwise use regular theme
    const activeTheme = isPreviewMode && previewTheme ? previewTheme : theme;
    applyThemeToDOM(activeTheme);
  }, [theme, isPreviewMode, previewTheme, pathname]);

  // Return the actual theme (light) for the specified paths, otherwise return the user's theme
  const effectiveTheme = lightThemeForcedPaths.includes(pathname)
    ? "light"
    : theme;

  return (
    <ThemeContext.Provider
      value={{ theme: effectiveTheme, setTheme: setTheme || (() => {}) }}
    >
      <DynamicFontLoader />
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
