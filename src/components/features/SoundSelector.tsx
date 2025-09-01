// components/features/SoundSelector.tsx
"use client";
import React, { useEffect, useRef } from "react"; // Import useEffect and useRef
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import {
  useAudioNotifications,
  type PomodoroSound,
} from "@/lib/hooks/useAudioNotifications";

interface SoundSelectorProps {
  soundEnabled: boolean;
  selectedSoundId: number | null;
  onSoundEnabledChange: (enabled: boolean) => void;
  onSoundSelectionChange: (soundId: number | null) => void;
  disabled?: boolean;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({
  soundEnabled,
  selectedSoundId,
  onSoundEnabledChange,
  onSoundSelectionChange,
  disabled = false,
}) => {
  const { sounds, loading, error, previewSound, isPlaying, currentPlayingId } =
    useAudioNotifications();

  const selectedSound = sounds.find((s) => s.id === selectedSoundId);
  const initialLoadDone = useRef(false);

  // This effect runs when sounds are loaded.
  // It sets the default sound to the first in the list if "None" is currently selected.
  useEffect(() => {
    if (!loading && sounds.length > 0 && !initialLoadDone.current) {
      if (selectedSoundId === null) {
        onSoundSelectionChange(sounds[0].id);
      }
      initialLoadDone.current = true; // Ensure this logic only runs once per component mount
    }
  }, [loading, sounds, selectedSoundId, onSoundSelectionChange]);

  const handleSoundSelect = (value: string) => {
    onSoundSelectionChange(parseInt(value));
  };

  const handlePreview = (soundId: number) => {
    previewSound(soundId);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Sound Notifications</Label>
          <div className="col-span-3 text-sm text-destructive">
            Failed to load sounds: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sound Enable/Disable Toggle */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Sound Notifications</Label>
          <div className="col-span-3 flex items-center space-x-2">
            <Switch
              checked={soundEnabled}
              onCheckedChange={onSoundEnabledChange}
              disabled={disabled || loading}
            />
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Disabled</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div></div>
          <div className="col-span-3">
            <p className="text-xs text-muted-foreground">
              Play a sound when focus sessions and breaks end
            </p>
          </div>
        </div>
      </div>

      {/* Sound Selection - only show when enabled */}
      {soundEnabled && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Notification Sound</Label>
            <div className="col-span-3 flex items-center space-x-2">
              {loading ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading sounds...</span>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedSoundId?.toString()}
                    onValueChange={handleSoundSelect}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Choose a sound" />
                    </SelectTrigger>
                    <SelectContent>
                      {sounds.map((sound) => (
                        <SelectItem key={sound.id} value={sound.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{sound.name}</span>
                            {sound.description && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {sound.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Preview Button */}
                  {selectedSoundId && selectedSound && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(selectedSoundId)}
                      disabled={disabled}
                      className="shrink-0"
                      title={
                        isPlaying && currentPlayingId === selectedSoundId
                          ? "Stop preview"
                          : "Preview sound"
                      }
                    >
                      {isPlaying && currentPlayingId === selectedSoundId ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {selectedSound && (
            <div className="grid grid-cols-4 gap-4">
              <div></div>
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground">
                  {selectedSound.description}
                  {selectedSound.duration_seconds && (
                    <span className="ml-2">
                      ({selectedSound.duration_seconds}s)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
