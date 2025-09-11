// lib/hooks/useUserPreferences.ts
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useProStatus } from "@/lib/hooks/useProStatus";

export type TimerStyle = "digital" | "ring" | "progress-bar" | "split-flap";

const proStyles: TimerStyle[] = ["ring", "progress-bar"];

export function useUserPreferences() {
  const supabase = createClient();
  const { user } = useUser();
  const { isPro } = useProStatus(user || null);

  const [timerStyle, setTimerStyle] = useState<TimerStyle>("digital");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // This effect determines when Supabase has finished its initial session check.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // This event fires once the initial user session has been loaded from storage.
      if (event === "INITIAL_SESSION") {
        setIsAuthReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const updateStyleInDb = useCallback(
    async (style: TimerStyle) => {
      if (!user) return;
      await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          timer_style: style,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    },
    [user, supabase]
  );

  // This is the main effect for loading, syncing, and validating the timer style.
  useEffect(() => {
    // Wait until the initial authentication check is complete.
    if (!isAuthReady) {
      // While waiting, we can pre-load from local storage to prevent UI flicker.
      const localStyle = localStorage.getItem(
        "timerStyle"
      ) as TimerStyle | null;
      if (localStyle) {
        setTimerStyle(localStyle);
      }
      return;
    }

    const syncAndValidate = async () => {
      setIsLoading(true);

      // Case 1: User is logged out.
      if (!user) {
        const storedStyle = localStorage.getItem(
          "timerStyle"
        ) as TimerStyle | null;
        // Revert if a pro style was left in local storage.
        if (storedStyle && proStyles.includes(storedStyle)) {
          setTimerStyle("digital");
          localStorage.setItem("timerStyle", "digital");
        }
        setIsLoading(false);
        return;
      }

      // Case 2: User is logged in. The database is the source of truth.
      const { data: preference } = await supabase
        .from("user_preferences")
        .select("timer_style")
        .eq("user_id", user.id)
        .single();

      const dbStyle = (preference?.timer_style as TimerStyle) || "digital";
      const isProStyleInDb = proStyles.includes(dbStyle);

      if (isProStyleInDb && !isPro) {
        // Validation failed: User is not Pro but has a Pro style in the DB.
        // This can happen if a subscription expires. We revert them and update the DB.
        setTimerStyle("digital");
        localStorage.setItem("timerStyle", "digital");
        await updateStyleInDb("digital");
      } else {
        // Validation passed: The style in the DB is valid for the user. Sync it.
        setTimerStyle(dbStyle);
        localStorage.setItem("timerStyle", dbStyle);
      }

      setIsLoading(false);
    };

    syncAndValidate();
  }, [isAuthReady, user, isPro, supabase, updateStyleInDb]);

  const applyTimerStyle = async (newStyle: TimerStyle) => {
    const canApply = !proStyles.includes(newStyle) || isPro;
    if (!canApply) {
      console.warn("Attempted to apply a pro style without pro status.");
      // As a fallback, revert to default if this somehow gets called.
      setTimerStyle("digital");
      return;
    }

    setTimerStyle(newStyle);
    localStorage.setItem("timerStyle", newStyle);

    if (user) {
      await updateStyleInDb(newStyle);
    }
  };

  return { timerStyle, applyTimerStyle, isLoading };
}
