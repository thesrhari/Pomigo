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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

interface PomodoroSettingsType {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  iterations: number;
}

interface PomodoroSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PomodoroSettingsType;
  updateSettings: (settings: PomodoroSettingsType) => Promise<void>;
}

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
          <DialogDescription>
            Customize your focus sessions and break times.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Focus Time */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="focusTime" className="text-right">
              Focus Time
            </Label>
            <Select
              value={localSettings.focusTime.toString()}
              onValueChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  focusTime: parseInt(value),
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="25">25 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Short Break */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shortBreak" className="text-right">
              Short Break
            </Label>
            <Select
              value={localSettings.shortBreak.toString()}
              onValueChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  shortBreak: parseInt(value),
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 minutes</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Long Break */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="longBreak" className="text-right">
              Long Break
            </Label>
            <Select
              value={localSettings.longBreak.toString()}
              onValueChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  longBreak: parseInt(value),
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Iterations */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="iterations" className="text-right">
              Iterations
            </Label>
            <Select
              value={localSettings.iterations.toString()}
              onValueChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  iterations: parseInt(value),
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 cycles</SelectItem>
                <SelectItem value="3">3 cycles</SelectItem>
                <SelectItem value="4">4 cycles</SelectItem>
                <SelectItem value="6">6 cycles</SelectItem>
                <SelectItem value="8">8 cycles</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
