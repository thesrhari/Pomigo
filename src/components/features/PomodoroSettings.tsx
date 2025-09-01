"use client";
import { useState, useEffect } from "react";
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

interface PomodoroSettingsType {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakEnabled: boolean;
  longBreakInterval: number;
  iterations: number;
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
}) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value);
    if (!isNaN(inputValue)) {
      const clampedValue = Math.max(min, Math.min(max, inputValue));
      onChange(clampedValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">{label}</Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <Input
              type="number"
              value={value}
              onChange={handleInputChange}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className="text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-left">
            {unit}
          </span>
        </div>
      </div>
      {description && (
        <div className="grid grid-cols-4 gap-4">
          <div></div>
          <div className="col-span-3">
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

  // Sync local state when settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSettings(localSettings);
      onClose();
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings); // Reset to original values
    onClose();
  };

  const updateLocalSetting = <K extends keyof PomodoroSettingsType>(
    key: K,
    value: PomodoroSettingsType[K]
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
          <DialogDescription>
            Customize your focus sessions and break times. The timer will
            automatically cycle between sessions and breaks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Focus Time */}
          <NumberInput
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

          {/* Short Break */}
          <NumberInput
            label="Short Break"
            value={localSettings.shortBreak}
            onChange={(value) => updateLocalSetting("shortBreak", value)}
            min={2}
            max={90}
            step={2}
            disabled={isLoading}
            unit="min"
            description="Duration of regular breaks between focus sessions"
          />

          {/* Long Break Toggle */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Long Break</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
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
            <div className="grid grid-cols-4 gap-4">
              <div></div>
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground">
                  Enable longer breaks at regular intervals
                </p>
              </div>
            </div>
          </div>

          {/* Long Break Duration - only show when enabled */}
          {localSettings.longBreakEnabled && (
            <NumberInput
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
          )}

          {/* Long Break Interval - only show when long break is enabled */}
          {localSettings.longBreakEnabled && (
            <NumberInput
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
          )}

          {/* Number of Cycles */}
          <NumberInput
            label="Total Cycles"
            value={localSettings.iterations}
            onChange={(value) => updateLocalSetting("iterations", value)}
            min={1}
            max={10}
            step={1}
            disabled={isLoading}
            unit="cycles"
            description="Total number of focus-break cycles to complete"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
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
