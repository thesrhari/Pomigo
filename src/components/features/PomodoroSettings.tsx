"use client";
import { useState } from "react";
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

interface PomodoroSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    focusTime: number;
    shortBreak: number;
    longBreak: number;
    iterations: number;
  };
  updateSettings: (settings: {
    focusTime: number;
    shortBreak: number;
    longBreak: number;
    iterations: number;
  }) => void;
}

export const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
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
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
