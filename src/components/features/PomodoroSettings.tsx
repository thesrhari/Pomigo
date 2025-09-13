"use client";
import { useState, useEffect, ChangeEvent, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Minus, Plus } from "lucide-react";
import { SoundSelector } from "@/components/features/SoundSelector";
import { toast } from "react-toastify";

// The settings type is expanded to include sound options
interface PomodoroSettingsType {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakEnabled: boolean;
  longBreakInterval: number;
  iterations: number;
  soundEnabled: boolean;
  selectedSoundId: number;
}

interface PomodoroSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PomodoroSettingsType;
  updateSettings: (settings: PomodoroSettingsType) => Promise<void>;
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  unit?: string;
  description?: string;
  id: string; // Added for accessibility
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  disabled = false,
  unit = "min",
  description,
  id,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  }, [min, value, step, onChange]);

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  }, [max, value, step, onChange]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    const parsedValue = parseInt(inputValue, 10);
    if (!isNaN(parsedValue)) {
      const clampedValue = Math.max(min, Math.min(max, parsedValue));
      onChange(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      // If input is not a valid number, revert to the original value
      setInputValue(value.toString());
    }
  }, [inputValue, min, max, value, onChange]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-x-4 gap-y-2">
        <Label htmlFor={id} className="md:text-right">
          {label}
        </Label>
        <div className="col-span-1 md:col-span-2 flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            aria-label={`Decrease ${label.toLowerCase()}`}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <Input
              id={id}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className="text-center w-full [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label={label}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            aria-label={`Increase ${label.toLowerCase()}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-14 text-left">
            {unit}
          </span>
        </div>
      </div>
      {description && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
          <div className="md:col-start-2 md:col-span-2">
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
}) => {
  const [localSettings, setLocalSettings] =
    useState<PomodoroSettingsType>(settings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset local settings when dialog opens or settings change
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings, isOpen]);

  // Effect to check for changes between localSettings and the original settings
  useEffect(() => {
    const detectChanges = () => {
      const changed =
        JSON.stringify(localSettings) !== JSON.stringify(settings);
      setHasChanges(changed);
    };
    detectChanges();
  }, [localSettings, settings]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await updateSettings(localSettings);
      onClose();
      toast.success("Settings saved successfully.");
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [hasChanges, localSettings, updateSettings, onClose]);

  const handleCancel = useCallback(() => {
    setLocalSettings(settings);
    setHasChanges(false);
    onClose();
  }, [settings, onClose]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  const updateLocalSetting = useCallback(
    <K extends keyof PomodoroSettingsType>(
      key: K,
      value: PomodoroSettingsType[K]
    ) => {
      setLocalSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // Prevent form submission on Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
          <DialogDescription>
            Customize your focus sessions and break times for optimal
            productivity.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 py-6">
          <NumberInput
            id="focusTime"
            label="Focus Time"
            value={localSettings.focusTime}
            onChange={(value) => updateLocalSetting("focusTime", value)}
            min={10}
            max={180}
            step={5}
            disabled={isLoading}
            unit="min"
            description="Duration of each focus session"
          />

          <NumberInput
            id="shortBreak"
            label="Short Break"
            value={localSettings.shortBreak}
            onChange={(value) => updateLocalSetting("shortBreak", value)}
            min={2}
            max={90}
            step={2}
            disabled={isLoading}
            unit="min"
            description="Duration of regular breaks"
          />

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-x-4 gap-y-2">
              <Label htmlFor="longBreakEnabled" className="md:text-right">
                Long Break
              </Label>
              <div className="col-span-1 md:col-span-2 flex items-center space-x-3">
                <Switch
                  id="longBreakEnabled"
                  checked={localSettings.longBreakEnabled}
                  onCheckedChange={(checked) =>
                    updateLocalSetting("longBreakEnabled", checked)
                  }
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">
                  {localSettings.longBreakEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
              <div className="md:col-start-2 md:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Enable longer breaks after a few cycles.
                </p>
              </div>
            </div>
          </div>

          {localSettings.longBreakEnabled && (
            <>
              <NumberInput
                id="longBreakDuration"
                label="Long Break Duration"
                value={localSettings.longBreak}
                onChange={(value) => updateLocalSetting("longBreak", value)}
                min={5}
                max={180}
                step={5}
                disabled={isLoading}
                unit="min"
                description="Duration of extended breaks"
              />

              <NumberInput
                id="longBreakAfter"
                label="Long Break After"
                value={localSettings.longBreakInterval}
                onChange={(value) =>
                  updateLocalSetting("longBreakInterval", value)
                }
                min={2}
                max={10}
                step={1}
                disabled={isLoading}
                unit="cycles"
                description="Number of focus sessions before a long break"
              />
            </>
          )}

          <NumberInput
            id="totalCycles"
            label="Total Cycles"
            value={localSettings.iterations}
            onChange={(value) => updateLocalSetting("iterations", value)}
            min={1}
            max={10}
            step={1}
            disabled={isLoading}
            unit="cycles"
            description="Total number of focus-break cycles"
          />

          <div className="border-t pt-8 mt-2">
            <SoundSelector
              soundEnabled={localSettings.soundEnabled}
              selectedSoundId={localSettings.selectedSoundId}
              onSoundEnabledChange={(enabled) =>
                updateLocalSetting("soundEnabled", enabled)
              }
              onSoundSelectionChange={(soundId) =>
                updateLocalSetting("selectedSoundId", soundId)
              }
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="cursor-pointer"
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
