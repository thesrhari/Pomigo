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

export const useAudioNotifications = () => {
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
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);

  // Preload audio files for better performance
  const preloadedAudioRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  // Preload audio files when sounds data changes
  useEffect(() => {
    if (!sounds) return;

    const preloadAudio = async () => {
      sounds.forEach((sound) => {
        if (!preloadedAudioRef.current.has(sound.id)) {
          const audio = new Audio(sound.file_path);
          audio.preload = "auto";
          audio.volume = 0.7;
          preloadedAudioRef.current.set(sound.id, audio);
        }
      });
    };

    preloadAudio();

    // Cleanup function
    return () => {
      preloadedAudioRef.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      preloadedAudioRef.current.clear();
    };
  }, [sounds]);

  const playSound = useCallback(
    async (soundId: number | null, enabled: boolean = true) => {
      if (!enabled || !soundId || !sounds) return;

      try {
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) return;

        // Multiple audio playback strategies
        const playStrategies = [
          // Strategy 1: Use preloaded audio
          async () => {
            const preloadedAudio = preloadedAudioRef.current.get(soundId);
            if (preloadedAudio) {
              preloadedAudio.currentTime = 0;
              await preloadedAudio.play();
              return preloadedAudio;
            }
            throw new Error("No preloaded audio");
          },

          // Strategy 2: Create new audio instance
          async () => {
            const audio = new Audio(sound.file_path);
            audio.volume = 0.7;
            await audio.play();
            return audio;
          },

          // Strategy 3: Use Web Audio API (more reliable in background)
          async () => {
            if ("webkitAudioContext" in window || "AudioContext" in window) {
              const AudioContext =
                window.AudioContext || (window as any).webkitAudioContext;
              const audioContext = new AudioContext();

              // Resume audio context if suspended (required by some browsers)
              if (audioContext.state === "suspended") {
                await audioContext.resume();
              }

              const response = await fetch(sound.file_path);
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await audioContext.decodeAudioData(
                arrayBuffer
              );

              const source = audioContext.createBufferSource();
              const gainNode = audioContext.createGain();

              source.buffer = audioBuffer;
              gainNode.gain.value = 0.7;

              source.connect(gainNode);
              gainNode.connect(audioContext.destination);

              source.start();

              // Create a fake audio element for consistency with fade-out logic
              const fakeAudio = {
                pause: () => source.stop(),
                currentTime: 0,
                volume: 0.7,
                duration: audioBuffer.duration,
              };

              return fakeAudio as HTMLAudioElement;
            }
            throw new Error("Web Audio API not available");
          },
        ];

        // Try each strategy until one succeeds
        let playedAudio: HTMLAudioElement | null = null;
        for (const strategy of playStrategies) {
          try {
            playedAudio = await strategy();
            break;
          } catch (err) {
            console.warn("Audio strategy failed, trying next:", err);
            continue;
          }
        }

        if (!playedAudio) {
          throw new Error("All audio playback strategies failed");
        }

        // Stop any currently playing audio
        if (audioRef.current && audioRef.current !== playedAudio) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        audioRef.current = playedAudio;

        // Implement fade-out for longer sounds
        if (sound.duration_seconds && sound.duration_seconds > 2) {
          setTimeout(() => {
            if (audioRef.current === playedAudio) {
              const fadeOut = setInterval(() => {
                if (playedAudio.volume > 0.1) {
                  playedAudio.volume -= 0.1;
                } else {
                  playedAudio.pause();
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

        // Try preloaded audio first, then fallback to new instance
        let audio: HTMLAudioElement;
        const preloadedAudio = preloadedAudioRef.current.get(soundId);

        if (preloadedAudio) {
          audio = preloadedAudio;
          audio.currentTime = 0;
        } else {
          audio = new Audio(sound.file_path);
          audio.volume = 0.7;
        }

        audioRef.current = audio;

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
      // Clean up preloaded audio
      preloadedAudioRef.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      preloadedAudioRef.current.clear();
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
    refetchSounds: refetch,
  };
};
