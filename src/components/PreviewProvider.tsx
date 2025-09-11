"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Theme } from "./ThemeProvider";

type PreviewContextType = {
  isPreviewMode: boolean;
  previewTheme: Theme | null;
  previewTimeLeft: number;
  startPreview: (theme: Theme) => void;
  exitPreview: () => void;
};

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(0);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const router = useRouter();
  const pathname = usePathname();

  const PREVIEW_DURATION = 30; // 30 seconds

  // Handle navigation in useEffect to avoid render-time navigation
  useEffect(() => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPreviewMode && previewTimeLeft > 0) {
      interval = setInterval(() => {
        setPreviewTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - exit preview mode
            setIsPreviewMode(false);
            setPreviewTheme(null);

            // Navigate back to customize if not already there
            if (pathname !== "/customize") {
              setPendingNavigation("/customize");
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPreviewMode, previewTimeLeft, pathname]);

  const startPreview = useCallback(
    (theme: Theme) => {
      setIsPreviewMode(true);
      setPreviewTheme(theme);
      setPreviewTimeLeft(PREVIEW_DURATION);

      // Navigate to dashboard if not already there
      if (pathname !== "/dashboard") {
        setPendingNavigation("/dashboard");
      }
    },
    [pathname]
  );

  const exitPreview = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewTheme(null);
    setPreviewTimeLeft(0);

    // Navigate back to customize if not already there
    if (pathname !== "/customize") {
      setPendingNavigation("/customize");
    }
  }, [pathname]);

  return (
    <PreviewContext.Provider
      value={{
        isPreviewMode,
        previewTheme,
        previewTimeLeft,
        startPreview,
        exitPreview,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used inside PreviewProvider");
  return ctx;
}
