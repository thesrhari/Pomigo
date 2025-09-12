// lib/hooks/useUserPreferences.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useProStatus } from "@/lib/hooks/useProStatus";
import { Theme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

// Type definitions remain the same
export type TimerStyle = "digital" | "ring" | "progress-bar" | "split-flap";

// Constants remain the same
const proStyles: TimerStyle[] = ["ring", "progress-bar", "split-flap"];
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
const defaultTheme: Theme = "light";

interface UserPreferences {
  timer_style: TimerStyle;
  theme: Theme;
}

// --- Fetcher and Updater Functions ---
const fetchPreferences = async (userId: string): Promise<UserPreferences> => {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("timer_style, theme")
    .eq("user_id", userId)
    .single();

  return {
    timer_style: data?.timer_style || defaultStyle,
    theme: data?.theme || defaultTheme,
  };
};

const updatePreferences = async (
  userId: string,
  prefs: Partial<UserPreferences>
) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(error.message);
};

// --- The Hook ---
export function useUserPreferences() {
  const { user } = useUser();
  const { isPro, isLoading: isProStatusLoading } = useProStatus();
  const queryClient = useQueryClient();

  const [localTimerStyle, setLocalTimerStyle] =
    useState<TimerStyle>(defaultStyle);
  const [localTheme, setLocalTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const storedTimerStyle = localStorage.getItem("timerStyle") as TimerStyle;
    if (storedTimerStyle) {
      setLocalTimerStyle(storedTimerStyle);
    }
    const storedTheme = localStorage.getItem("theme") as Theme;
    if (storedTheme) {
      setLocalTheme(storedTheme);
    }
  }, []);

  const { data: dbPreferences, isLoading: isPrefsLoading } = useQuery({
    queryKey: ["userPreferences", user?.id],
    queryFn: () => fetchPreferences(user!.id),
    enabled: !!user,
  });

  // --- Data Mutation for Authenticated Users ---
  const { mutate: updateUserPreferences, isPending: isUpdating } = useMutation({
    mutationFn: (newPrefs: Partial<UserPreferences>) =>
      updatePreferences(user!.id, newPrefs),
    onSuccess: (data, newPrefs) => {
      queryClient.setQueryData(
        ["userPreferences", user?.id],
        (oldData: UserPreferences | undefined) => {
          if (oldData) {
            return {
              ...oldData,
              ...newPrefs,
            };
          }
          return {
            timer_style: newPrefs.timer_style || defaultStyle,
            theme: newPrefs.theme || defaultTheme,
          };
        }
      );
    },
    onError: (error) => {
      console.error("Failed to update preferences:", error);
    },
  });

  // --- Preference Validation and Derivation ---
  let timerStyle = user
    ? dbPreferences?.timer_style ?? defaultStyle
    : localTimerStyle;
  let theme = user ? dbPreferences?.theme ?? defaultTheme : localTheme;

  if (user && !isProStatusLoading && !isPro) {
    if (proStyles.includes(timerStyle)) {
      timerStyle = defaultStyle;
    }
    if (proThemes.includes(theme)) {
      theme = defaultTheme;
    }
  }

  useEffect(() => {
    localStorage.setItem("timerStyle", timerStyle);
    localStorage.setItem("theme", theme);
  }, [timerStyle, theme]);

  // --- Public Functions to Apply Changes ---
  const applyTimerStyle = (newStyle: TimerStyle) => {
    if (user) {
      if (!isPro && proStyles.includes(newStyle)) return;
      updateUserPreferences({ timer_style: newStyle });
    } else {
      if (proStyles.includes(newStyle)) return;
      setLocalTimerStyle(newStyle);
    }
  };

  const applyTheme = (newTheme: Theme) => {
    if (user) {
      if (!isPro && proThemes.includes(newTheme)) return;
      updateUserPreferences({ theme: newTheme });
    } else {
      if (proThemes.includes(newTheme)) return;
      setLocalTheme(newTheme);
    }
  };

  return {
    timerStyle,
    applyTimerStyle,
    theme,
    applyTheme,
    isLoading: isPrefsLoading || isProStatusLoading,
    isUpdating,
  };
}
