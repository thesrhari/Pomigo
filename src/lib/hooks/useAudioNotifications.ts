import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

export interface PomodoroSound {
  id: number;
  name: string;
  file_path: string;
  description: string | null;
  duration_seconds: number | null;
}

const supabase = createClient();

const fetchSounds = async (): Promise<PomodoroSound[]> => {
  const { data, error } = await supabase
    .from("pomodoro_sounds")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAudioNotifications = () => {
  const {
    data: sounds,
    error,
    isLoading,
    mutate,
  } = useSWR("pomodoro_sounds", fetchSounds);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);

  const playSound = useCallback(
    async (soundId: number | null, enabled: boolean = true) => {
      if (!enabled || !soundId || !sounds) return;

      try {
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) return;

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        const audio = new Audio(sound.file_path);
        audioRef.current = audio;
        audio.volume = 0.7;

        await audio.play();

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

  const previewSound = useCallback(
    async (soundId: number) => {
      if (isPlaying && currentPlayingId === soundId) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentPlayingId(null);
        return;
      }

      try {
        if (!sounds) return;
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) return;

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

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingId(null);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    sounds: sounds || [],
    loading: isLoading,
    error: error ? error.message : null,
    playSound,
    previewSound,
    stopSound,
    isPlaying,
    currentPlayingId,
    refetchSounds: mutate,
  };
};
