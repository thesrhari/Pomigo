"use client";

import { createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
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

const lightThemeForcedPaths = ["/", "/login"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The hook now gets state directly from the shared context
  const { theme, applyTheme: setTheme } = useUserPreferences();
  const { isPreviewMode, previewTheme } = usePreview();
  const pathname = usePathname();

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
      document.documentElement.classList.remove(...validThemes);
      if (t !== "light") {
        document.documentElement.classList.add(t);
      }
    };

    if (lightThemeForcedPaths.includes(pathname)) {
      applyThemeToDOM("light");
      return;
    }

    const activeTheme = isPreviewMode && previewTheme ? previewTheme : theme;
    applyThemeToDOM(activeTheme);
  }, [theme, isPreviewMode, previewTheme, pathname]);

  const effectiveTheme = lightThemeForcedPaths.includes(pathname)
    ? "light"
    : theme;

  return (
    <ThemeContext.Provider value={{ theme: effectiveTheme, setTheme }}>
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
