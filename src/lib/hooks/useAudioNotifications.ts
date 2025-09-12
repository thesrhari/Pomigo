import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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

export const useAudioNotifications = (selectedSoundId: number | null) => {
  const {
    data: sounds,
    error,
    isPending: isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pomodoro_sounds"],
    queryFn: fetchSounds,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Effect to load the selected sound
  useEffect(() => {
    // Clean up the previous audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (selectedSoundId && sounds) {
      const sound = sounds.find((s) => s.id === selectedSoundId);
      if (sound) {
        audioRef.current = new Audio(sound.file_path);
        audioRef.current.volume = 0.7;
      }
    }
  }, [selectedSoundId, sounds]);

  const playSound = useCallback((enabled: boolean = true) => {
    // Re-added the check for the 'enabled' flag
    if (!enabled || !audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((err) => {
      console.error("Error playing sound:", err);
    });
  }, []); // No dependencies needed as it only relies on audioRef

  const previewSound = useCallback(async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Error previewing sound:", err);
            setIsPlaying(false);
          });
      }
    }

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audioRef.current.addEventListener("ended", handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleEnded);
      }
    };
  }, [isPlaying]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // General cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
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
    refetchSounds: refetch,
  };
};
