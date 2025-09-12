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

export const useAudioNotifications = (selectedSoundId?: number | null) => {
  const {
    data: sounds,
    error,
    isPending: isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pomodoro_sounds"],
    queryFn: fetchSounds,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cache for loaded audio - load selected audio immediately, others on demand
  const audioCache = useRef<Map<number, HTMLAudioElement>>(new Map());
  const loadingCache = useRef<Map<number, Promise<HTMLAudioElement>>>(
    new Map()
  );
  const preloadedSelectedId = useRef<number | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (fadeOutTimerRef.current) {
      clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
    if (fadeOutIntervalRef.current) {
      clearInterval(fadeOutIntervalRef.current);
      fadeOutIntervalRef.current = null;
    }
  }, []);

  // Create fresh audio instance with proper initialization
  const createFreshAudio = useCallback(
    (filePath: string): Promise<HTMLAudioElement> => {
      return new Promise((resolve, reject) => {
        const audio = new Audio();

        // Important: Set volume BEFORE setting src to avoid browser quirks
        audio.volume = 0.7;
        audio.preload = "auto";

        const onCanPlay = () => {
          cleanup();
          // Double-check volume is set correctly
          audio.volume = 0.7;
          resolve(audio);
        };

        const onError = (e: Event) => {
          cleanup();
          reject(new Error(`Failed to load audio: ${filePath}`));
        };

        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onCanPlay);
          audio.removeEventListener("error", onError);
        };

        audio.addEventListener("canplaythrough", onCanPlay);
        audio.addEventListener("error", onError);

        // Set src after event listeners are attached
        audio.src = filePath;
      });
    },
    []
  );

  // Load audio on-demand with caching
  const loadAudio = useCallback(
    async (soundId: number): Promise<HTMLAudioElement> => {
      if (!sounds) {
        throw new Error("Sounds not loaded");
      }

      // Return cached audio if available
      const cachedAudio = audioCache.current.get(soundId);
      if (cachedAudio) {
        // Always reset state for cached audio
        cachedAudio.currentTime = 0;
        // Force volume reset - this is crucial for the first audio issue
        cachedAudio.volume = 0.7;
        return cachedAudio;
      }

      // Return existing loading promise if audio is currently being loaded
      const existingPromise = loadingCache.current.get(soundId);
      if (existingPromise) {
        const audio = await existingPromise;
        // Ensure volume is correct even for concurrent loads
        audio.volume = 0.7;
        audio.currentTime = 0;
        return audio;
      }

      const sound = sounds.find((s) => s.id === soundId);
      if (!sound) {
        throw new Error(`Sound with id ${soundId} not found`);
      }

      // Create loading promise
      const loadingPromise = createFreshAudio(sound.file_path)
        .then((audio) => {
          // Cache the loaded audio
          audioCache.current.set(soundId, audio);
          // Remove from loading cache
          loadingCache.current.delete(soundId);
          return audio;
        })
        .catch((error) => {
          loadingCache.current.delete(soundId);
          throw error;
        });

      // Cache the loading promise
      loadingCache.current.set(soundId, loadingPromise);

      return loadingPromise;
    },
    [sounds, createFreshAudio]
  );

  // Preload selected audio when it changes
  useEffect(() => {
    if (
      !sounds ||
      !selectedSoundId ||
      selectedSoundId === preloadedSelectedId.current
    ) {
      return;
    }

    const preloadSelectedAudio = async () => {
      try {
        await loadAudio(selectedSoundId);
        preloadedSelectedId.current = selectedSoundId;
        console.log(`Preloaded selected audio: ${selectedSoundId}`);
      } catch (error) {
        console.warn(
          `Failed to preload selected audio ${selectedSoundId}:`,
          error
        );
      }
    };

    preloadSelectedAudio();
  }, [sounds, selectedSoundId, loadAudio]);

  const stopCurrentAudio = useCallback(() => {
    clearTimers();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Remove event listeners to prevent memory leaks
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }

    setIsPlaying(false);
    setCurrentPlayingId(null);
  }, [clearTimers]);

  const playSound = useCallback(
    async (soundId: number | null, enabled: boolean = true) => {
      if (!enabled || !soundId || !sounds) return;

      try {
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) {
          console.warn(`Sound with id ${soundId} not found`);
          return;
        }

        // Stop any currently playing audio
        stopCurrentAudio();

        // Multiple audio playback strategies
        const playStrategies = [
          // Strategy 1: Use cached/loaded audio
          async () => {
            const audio = await loadAudio(soundId);
            // Critical: Always reset volume and time before playing
            audio.volume = 0.7;
            audio.currentTime = 0;
            await audio.play();
            return audio;
          },

          // Strategy 2: Create fresh audio instance (fallback)
          async () => {
            const audio = await createFreshAudio(sound.file_path);
            await audio.play();
            return audio;
          },

          // Strategy 3: Use Web Audio API (more reliable in background)
          async () => {
            if (
              !("AudioContext" in window) &&
              !("webkitAudioContext" in window)
            ) {
              throw new Error("Web Audio API not available");
            }

            const AudioContext =
              window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext();

            // Resume audio context if suspended (required by some browsers)
            if (audioContext.state === "suspended") {
              await audioContext.resume();
            }

            const response = await fetch(sound.file_path);
            if (!response.ok) {
              throw new Error(`Failed to fetch audio: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();

            source.buffer = audioBuffer;
            gainNode.gain.value = 0.7;

            source.connect(gainNode);
            gainNode.connect(audioContext.destination);

            source.start();

            // Create a fake audio element for consistency with fade-out logic
            const fakeAudio = {
              pause: () => {
                try {
                  source.stop();
                } catch (e) {
                  // Source may already be stopped
                }
              },
              currentTime: 0,
              volume: 0.7,
              duration: audioBuffer.duration,
              onended: null as (() => void) | null,
              onerror: null as (() => void) | null,
            };

            // Handle source end event
            source.addEventListener("ended", () => {
              if (fakeAudio.onended) {
                fakeAudio.onended();
              }
            });

            return fakeAudio as HTMLAudioElement;
          },
        ];

        // Try each strategy until one succeeds
        let playedAudio: HTMLAudioElement | null = null;
        let lastError: Error | null = null;

        for (const strategy of playStrategies) {
          try {
            playedAudio = await strategy();
            break;
          } catch (err) {
            lastError = err as Error;
            console.warn("Audio strategy failed, trying next:", err);
            continue;
          }
        }

        if (!playedAudio) {
          throw new Error(
            `All audio playback strategies failed. Last error: ${lastError?.message}`
          );
        }

        audioRef.current = playedAudio;

        // Implement fade-out for longer sounds
        if (sound.duration_seconds && sound.duration_seconds > 2) {
          fadeOutTimerRef.current = setTimeout(() => {
            if (audioRef.current === playedAudio && playedAudio.volume > 0) {
              const originalVolume = playedAudio.volume;
              fadeOutIntervalRef.current = setInterval(() => {
                if (playedAudio.volume > 0.1) {
                  playedAudio.volume = Math.max(
                    0,
                    playedAudio.volume - originalVolume * 0.1
                  );
                } else {
                  playedAudio.pause();
                  clearTimers();
                }
              }, 200);
            }
          }, (sound.duration_seconds - 1) * 1000);
        }
      } catch (err) {
        console.error("Error playing sound:", err);
        stopCurrentAudio();
      }
    },
    [sounds, stopCurrentAudio, clearTimers, loadAudio, createFreshAudio]
  );

  const previewSound = useCallback(
    async (soundId: number) => {
      // If same sound is playing, stop it
      if (isPlaying && currentPlayingId === soundId) {
        stopCurrentAudio();
        return;
      }

      try {
        if (!sounds) {
          console.warn("Sounds not loaded yet");
          return;
        }

        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) {
          console.warn(`Sound with id ${soundId} not found`);
          return;
        }

        // Stop any currently playing audio
        stopCurrentAudio();

        setIsPlaying(true);
        setCurrentPlayingId(soundId);

        let audio: HTMLAudioElement;

        try {
          // Try to load from cache or load on demand
          audio = await loadAudio(soundId);

          // Critical: Always ensure proper state for preview
          audio.volume = 0.7;
          audio.currentTime = 0;
        } catch (loadError) {
          console.warn(
            "Failed to load cached audio, creating fresh instance:",
            loadError
          );

          // Fallback to fresh audio instance
          audio = await createFreshAudio(sound.file_path);
        }

        audioRef.current = audio;

        // Set up event listeners
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentPlayingId(null);
          clearTimers();
        };

        audio.onerror = (e) => {
          console.error("Error playing audio file:", sound.file_path, e);
          setIsPlaying(false);
          setCurrentPlayingId(null);
          clearTimers();
        };

        // Double-check volume before playing (fix for first audio issue)
        audio.volume = 0.7;
        await audio.play();
      } catch (err) {
        console.error("Error previewing sound:", err);
        setIsPlaying(false);
        setCurrentPlayingId(null);
        clearTimers();
      }
    },
    [
      sounds,
      isPlaying,
      currentPlayingId,
      stopCurrentAudio,
      clearTimers,
      loadAudio,
      createFreshAudio,
    ]
  );

  const stopSound = useCallback(() => {
    stopCurrentAudio();
  }, [stopCurrentAudio]);

  // Clean up cache when sounds change
  useEffect(() => {
    if (!sounds) return;

    const currentSoundIds = new Set(sounds.map((s) => s.id));

    // Remove cached audio for sounds that no longer exist
    audioCache.current.forEach((audio, id) => {
      if (!currentSoundIds.has(id)) {
        audio.pause();
        audio.src = "";
        audio.onended = null;
        audio.onerror = null;
        audioCache.current.delete(id);
      }
    });

    // Clean up any pending loading promises for removed sounds
    loadingCache.current.forEach((promise, id) => {
      if (!currentSoundIds.has(id)) {
        loadingCache.current.delete(id);
      }
    });

    // Reset preloaded tracking if selected sound is no longer available
    if (
      preloadedSelectedId.current &&
      !currentSoundIds.has(preloadedSelectedId.current)
    ) {
      preloadedSelectedId.current = null;
    }
  }, [sounds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current = null;
      }

      // Clean up cached audio
      audioCache.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
        audio.onended = null;
        audio.onerror = null;
      });
      audioCache.current.clear();
      loadingCache.current.clear();
      preloadedSelectedId.current = null;
    };
  }, [clearTimers]);

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
