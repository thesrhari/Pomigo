// lib/hooks/useAudioNotifications.ts
import { useState, useEffect, useCallback, useRef } from "react";

export interface PomodoroSound {
  id: number;
  name: string;
  file_path: string;
  description: string | null;
  duration_seconds: number | null;
}

export const useAudioNotifications = () => {
  const [sounds, setSounds] = useState<PomodoroSound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);

  // Fetch available sounds from database
  const fetchSounds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // You'll need to import your supabase client here
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error: supabaseError } = await supabase
        .from("pomodoro_sounds")
        .select("*")
        .order("name");

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setSounds(data || []);
    } catch (err) {
      console.error("Error fetching sounds:", err);
      setError(err instanceof Error ? err.message : "Failed to load sounds");
    } finally {
      setLoading(false);
    }
  }, []);

  // Play a sound notification
  const playSound = useCallback(
    async (soundId: number | null, enabled: boolean = true) => {
      if (!enabled || !soundId) return;

      try {
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) return;

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        // Create new audio instance
        const audio = new Audio(sound.file_path);
        audioRef.current = audio;

        // Set volume (you might want to make this configurable)
        audio.volume = 0.7;

        // Play the sound
        await audio.play();

        // Optional: Add fade out effect for longer sounds
        if (sound.duration_seconds && sound.duration_seconds > 2) {
          setTimeout(() => {
            if (audioRef.current === audio) {
              const fadeOut = setInterval(() => {
                if (audio.volume > 0.1) {
                  audio.volume -= 0.1;
                } else {
                  audio.pause();
                  clearInterval(fadeOut);
                }
              }, 200);
            }
          }, (sound.duration_seconds - 1) * 1000);
        }
      } catch (err) {
        console.error("Error playing sound:", err);
      }
    },
    [sounds]
  );

  // Preview a sound (with visual feedback)
  const previewSound = useCallback(
    async (soundId: number) => {
      if (isPlaying && currentPlayingId === soundId) {
        // Stop current preview
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentPlayingId(null);
        return;
      }

      try {
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) return;

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        setIsPlaying(true);
        setCurrentPlayingId(soundId);

        const audio = new Audio(sound.file_path);
        audioRef.current = audio;
        audio.volume = 0.7;

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentPlayingId(null);
        });

        audio.addEventListener("error", () => {
          setIsPlaying(false);
          setCurrentPlayingId(null);
          console.error("Error loading audio file:", sound.file_path);
        });

        await audio.play();
      } catch (err) {
        console.error("Error previewing sound:", err);
        setIsPlaying(false);
        setCurrentPlayingId(null);
      }
    },
    [sounds, isPlaying, currentPlayingId]
  );

  // Stop any currently playing sound
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingId(null);
  }, []);

  // Load sounds on mount
  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    sounds,
    loading,
    error,
    playSound,
    previewSound,
    stopSound,
    isPlaying,
    currentPlayingId,
    refetchSounds: fetchSounds,
  };
};
