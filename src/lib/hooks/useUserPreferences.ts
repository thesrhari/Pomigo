// lib/hooks/useUserPreferences.ts
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useProStatus } from "@/lib/hooks/useProStatus";
import { Theme } from "@/components/ThemeProvider";

// Type definitions
export type TimerStyle = "digital" | "ring" | "progress-bar" | "split-flap";

// Constants for Pro features and defaults
const proStyles: TimerStyle[] = ["ring", "progress-bar"];
const proThemes: Theme[] = [
  "doom", // Fixed: removed "ocean" as it's marked as free in ThemesTab
  "cozy",
  "nature",
  "cyberpunk",
  "amethyst",
  "grove",
];
const defaultStyle: TimerStyle = "digital";
const defaultTheme: Theme = "light";

export function useUserPreferences() {
  const supabase = createClient();
  const { user } = useUser();
  const { isPro, isLoading: isProStatusLoading } = useProStatus(user || null);

  // State for both preferences
  const [timerStyle, setTimerStyle] = useState<TimerStyle>(defaultStyle);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") {
        setIsAuthReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const updatePreferencesInDb = useCallback(
    async (prefs: { style?: TimerStyle; theme?: Theme }) => {
      if (!user) return;

      const updates: {
        user_id: string;
        timer_style?: TimerStyle;
        theme?: Theme;
        updated_at: string;
      } = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (prefs.style) updates.timer_style = prefs.style;
      if (prefs.theme) updates.theme = prefs.theme;

      await supabase
        .from("user_preferences")
        .upsert(updates, { onConflict: "user_id" });
    },
    [user, supabase]
  );

  // Main effect for loading, syncing, and validating preferences
  useEffect(() => {
    // Pre-load from local storage before auth is ready to prevent UI flicker
    if (!isAuthReady) {
      const localStyle = localStorage.getItem(
        "timerStyle"
      ) as TimerStyle | null;
      if (localStyle) setTimerStyle(localStyle);
      const localTheme = localStorage.getItem("theme") as Theme | null;
      if (localTheme) setTheme(localTheme);
      return;
    }

    const syncAndValidate = async () => {
      setIsLoading(true);

      // Case 1: User is logged out. Use local storage, but revert Pro features.
      if (!user) {
        const localStyle = localStorage.getItem(
          "timerStyle"
        ) as TimerStyle | null;
        const validStyle =
          localStyle && proStyles.includes(localStyle)
            ? defaultStyle
            : localStyle || defaultStyle;
        setTimerStyle(validStyle);
        localStorage.setItem("timerStyle", validStyle);

        const localTheme = localStorage.getItem("theme") as Theme | null;
        const validTheme =
          localTheme && proThemes.includes(localTheme)
            ? defaultTheme
            : localTheme || defaultTheme;
        setTheme(validTheme);
        localStorage.setItem("theme", validTheme);

        setIsLoading(false);
        return;
      }

      // Case 2: User is logged in. Wait for Pro status to load before validation.
      if (isProStatusLoading) {
        // Still loading pro status, just load from DB/localStorage without validation
        const { data: preference } = await supabase
          .from("user_preferences")
          .select("timer_style, theme")
          .eq("user_id", user.id)
          .single();

        const dbStyle = (preference?.timer_style as TimerStyle) || defaultStyle;
        const dbTheme = (preference?.theme as Theme) || defaultTheme;

        setTimerStyle(dbStyle);
        localStorage.setItem("timerStyle", dbStyle);
        setTheme(dbTheme);
        localStorage.setItem("theme", dbTheme);

        setIsLoading(false);
        return;
      }

      // Case 3: User is logged in and Pro status is loaded. Validate preferences.
      const { data: preference } = await supabase
        .from("user_preferences")
        .select("timer_style, theme")
        .eq("user_id", user.id)
        .single();

      let dbStyle = (preference?.timer_style as TimerStyle) || defaultStyle;
      let dbTheme = (preference?.theme as Theme) || defaultTheme;
      let needsDbUpdate = false;

      // Validate timer style
      if (proStyles.includes(dbStyle) && !isPro) {
        dbStyle = defaultStyle;
        needsDbUpdate = true;
      }
      // Validate theme
      if (proThemes.includes(dbTheme) && !isPro) {
        dbTheme = defaultTheme;
        needsDbUpdate = true;
      }

      // Apply the validated preferences and sync to local storage
      setTimerStyle(dbStyle);
      localStorage.setItem("timerStyle", dbStyle);
      setTheme(dbTheme);
      localStorage.setItem("theme", dbTheme);

      // If validation failed, update the DB with the reverted default values
      if (needsDbUpdate) {
        await updatePreferencesInDb({ style: dbStyle, theme: dbTheme });
      }

      setIsLoading(false);
    };

    syncAndValidate();
  }, [
    isAuthReady,
    user,
    isPro,
    isProStatusLoading,
    supabase,
    updatePreferencesInDb,
  ]);

  // Function to apply a new timer style
  const applyTimerStyle = async (newStyle: TimerStyle) => {
    if (proStyles.includes(newStyle) && !isPro) {
      console.warn("Attempted to apply a pro style without pro status.");
      return;
    }
    setTimerStyle(newStyle);
    localStorage.setItem("timerStyle", newStyle);
    if (user) {
      await updatePreferencesInDb({ style: newStyle });
    }
  };

  // Function to apply a new theme
  const applyTheme = async (newTheme: Theme) => {
    if (proThemes.includes(newTheme) && !isPro) {
      console.warn("Attempted to apply a pro theme without pro status.");
      return;
    }
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (user) {
      await updatePreferencesInDb({ theme: newTheme });
    }
  };

  return {
    timerStyle,
    applyTimerStyle,
    theme,
    applyTheme,
    isLoading: isLoading || isProStatusLoading, // Loading until both auth and pro status are ready
  };
}
