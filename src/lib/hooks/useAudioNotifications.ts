import { useState, useEffect, useCallback, useRef } from "react";

export interface PomodoroSound {
  id: number;
  name: string;
  file_path: string;
  description: string | null;
  duration_seconds: number | null;
}

// Hardcoded data based on the provided image
const hardcodedSounds: PomodoroSound[] = [
  {
    id: 1,
    name: "Bell 1",
    file_path: "/sounds/bell_1.mp3",
    description: "Classic bell sound",
    duration_seconds: 1,
  },
  {
    id: 2,
    name: "Bell 2",
    file_path: "/sounds/bell_2.mp3",
    description: "Simple digital notification",
    duration_seconds: 1,
  },
  {
    id: 3,
    name: "Microwave",
    file_path: "/sounds/microwave_1.mp3",
    description: "Gentle notification sound",
    duration_seconds: 1,
  },
  {
    id: 4,
    name: "Notification 1",
    file_path: "/sounds/notification_1.mp3",
    description: "Wooden percussion sound",
    duration_seconds: 1,
  },
  {
    id: 5,
    name: "Notification 2",
    file_path: "/sounds/notification_2.mp3",
    description: "Calming singing bowl",
    duration_seconds: 1,
  },
];

export const useAudioNotifications = (selectedSoundId?: number | null) => {
  // Use state to hold the hardcoded sounds, mimicking the async hook structure
  const [sounds] = useState<PomodoroSound[]>(hardcodedSounds);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cache for loaded audio
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
        audio.volume = 0.7;
        audio.preload = "auto";

        const onCanPlay = () => {
          cleanup();
          audio.volume = 0.7;
          resolve(audio);
        };

        const onError = () => {
          cleanup();
          reject(new Error(`Failed to load audio: ${filePath}`));
        };

        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onCanPlay);
          audio.removeEventListener("error", onError);
        };

        audio.addEventListener("canplaythrough", onCanPlay);
        audio.addEventListener("error", onError);
        audio.src = filePath;
      });
    },
    []
  );

  // Load audio on-demand with caching
  const loadAudio = useCallback(
    async (soundId: number): Promise<HTMLAudioElement> => {
      const cachedAudio = audioCache.current.get(soundId);
      if (cachedAudio) {
        cachedAudio.currentTime = 0;
        cachedAudio.volume = 0.7;
        return cachedAudio;
      }

      const existingPromise = loadingCache.current.get(soundId);
      if (existingPromise) {
        const audio = await existingPromise;
        audio.volume = 0.7;
        audio.currentTime = 0;
        return audio;
      }

      const sound = sounds.find((s) => s.id === soundId);
      if (!sound) {
        throw new Error(`Sound with id ${soundId} not found`);
      }

      const loadingPromise = createFreshAudio(sound.file_path)
        .then((audio) => {
          audioCache.current.set(soundId, audio);
          loadingCache.current.delete(soundId);
          return audio;
        })
        .catch((error) => {
          loadingCache.current.delete(soundId);
          throw error;
        });

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

        stopCurrentAudio();

        const playStrategies = [
          // Strategy 1: Use cached/loaded audio
          async () => {
            const audio = await loadAudio(soundId);
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
          // Strategy 3: Use Web Audio API
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
            const fakeAudio = {
              pause: () => {
                try {
                  source.stop();
                } catch {}
              },
              currentTime: 0,
              volume: 0.7,
              duration: audioBuffer.duration,
              onended: null as (() => void) | null,
              onerror: null as (() => void) | null,
            };
            source.addEventListener("ended", () => {
              if (fakeAudio.onended) fakeAudio.onended();
            });
            return fakeAudio as HTMLAudioElement;
          },
        ];

        let playedAudio: HTMLAudioElement | null = null;
        let lastError: Error | null = null;
        for (const strategy of playStrategies) {
          try {
            playedAudio = await strategy();
            break;
          } catch (err) {
            lastError = err as Error;
            console.warn("Audio strategy failed, trying next:", err);
          }
        }
        if (!playedAudio) {
          throw new Error(
            `All audio playback strategies failed. Last error: ${lastError?.message}`
          );
        }
        audioRef.current = playedAudio;
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
      if (isPlaying && currentPlayingId === soundId) {
        stopCurrentAudio();
        return;
      }
      try {
        const sound = sounds.find((s) => s.id === soundId);
        if (!sound) {
          console.warn(`Sound with id ${soundId} not found`);
          return;
        }
        stopCurrentAudio();
        setIsPlaying(true);
        setCurrentPlayingId(soundId);
        let audio: HTMLAudioElement;
        try {
          audio = await loadAudio(soundId);
          audio.volume = 0.7;
          audio.currentTime = 0;
        } catch (loadError) {
          console.warn(
            "Failed to load cached audio, creating fresh instance:",
            loadError
          );
          audio = await createFreshAudio(sound.file_path);
        }
        audioRef.current = audio;
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
    const currentSoundIds = new Set(sounds.map((s) => s.id));
    audioCache.current.forEach((audio, id) => {
      if (!currentSoundIds.has(id)) {
        audio.pause();
        audio.src = "";
        audio.onended = null;
        audio.onerror = null;
        audioCache.current.delete(id);
      }
    });
    loadingCache.current.forEach((promise, id) => {
      if (!currentSoundIds.has(id)) {
        loadingCache.current.delete(id);
      }
    });
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
    sounds,
    loading: isLoading,
    error,
    playSound,
    previewSound,
    stopSound,
    isPlaying,
    currentPlayingId,
  };
};
