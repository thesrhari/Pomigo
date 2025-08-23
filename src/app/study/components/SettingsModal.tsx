"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TimerSettings } from "./PomodoroTimer";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimerSettings;
  onUpdate: (settings: TimerSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
}) => {
  const [localSettings, setLocalSettings] = useState<TimerSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  const updateSetting = (key: keyof TimerSettings, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Timer Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Duration Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Session Durations</h3>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="work-duration"
                  className="text-sm text-muted-foreground"
                >
                  Work Session (minutes)
                </Label>
                <Input
                  id="work-duration"
                  type="number"
                  value={Math.floor(localSettings.workDuration / 60)}
                  onChange={(e) =>
                    updateSetting("workDuration", parseInt(e.target.value) * 60)
                  }
                  className="mt-1 bg-input border-border focus:ring-primary focus:border-primary"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="short-break"
                  className="text-sm text-muted-foreground"
                >
                  Short Break (minutes)
                </Label>
                <Input
                  id="short-break"
                  type="number"
                  value={Math.floor(localSettings.shortBreakDuration / 60)}
                  onChange={(e) =>
                    updateSetting(
                      "shortBreakDuration",
                      parseInt(e.target.value) * 60
                    )
                  }
                  className="mt-1 bg-input border-border focus:ring-success focus:border-success"
                  min="1"
                  max="60"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="long-break"
                  className="text-sm text-muted-foreground"
                >
                  Long Break (minutes)
                </Label>
                <Input
                  id="long-break"
                  type="number"
                  value={Math.floor(localSettings.longBreakDuration / 60)}
                  onChange={(e) =>
                    updateSetting(
                      "longBreakDuration",
                      parseInt(e.target.value) * 60
                    )
                  }
                  className="mt-1 bg-input border-border focus:ring-accent focus:border-accent"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="sessions-count"
                  className="text-sm text-muted-foreground"
                >
                  Sessions before long break
                </Label>
                <Input
                  id="sessions-count"
                  type="number"
                  value={localSettings.sessionsBeforeLongBreak}
                  onChange={(e) =>
                    updateSetting(
                      "sessionsBeforeLongBreak",
                      parseInt(e.target.value)
                    )
                  }
                  className="mt-1 bg-input border-border focus:ring-primary focus:border-primary"
                  min="2"
                  max="10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Timer Style */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Timer Style</Label>
            <RadioGroup
              value={localSettings.timerStyle}
              onValueChange={(value) =>
                updateSetting("timerStyle", value as "digital" | "circular")
              }
              className="grid grid-cols-1 gap-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <RadioGroupItem value="digital" id="digital" />
                <Label htmlFor="digital" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">
                    Digital Text Only
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Clean numerical display
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <RadioGroupItem value="circular" id="circular" />
                <Label htmlFor="circular" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">
                    Circular Progress
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Digital text with progress ring
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="px-6 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
