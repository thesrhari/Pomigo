import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Lock, Eye } from "lucide-react";
import { useTheme, Theme } from "@/components/ThemeProvider";
import { usePreview } from "@/components/PreviewProvider";
import { useProStatus } from "@/lib/hooks/useProStatus";
import { useUser } from "@/lib/hooks/useUser";

interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
  isPro: boolean;
  previewColors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface ThemesTabProps {
  onUpgradeClick: () => void;
}

const themeOptions: ThemeOption[] = [
  {
    id: "light",
    name: "Classic",
    description: "Clean and minimal light theme",
    isPro: false,
    previewColors: {
      background: "hsl(0 0% 99.2157%)",
      primary: "hsl(257.9412 100% 60%)",
      secondary: "hsl(214.2857 24.1379% 94.3137%)",
      accent: "hsl(221.3793 100% 94.3137%)",
    },
  },
  {
    id: "dark",
    name: "Classic Dark",
    description: "Elegant dark theme for focused work",
    isPro: false,
    previewColors: {
      background: "hsl(225 7.1429% 10.9804%)",
      primary: "hsl(257.6687 100% 68.0392%)",
      secondary: "hsl(226.6667 9.6774% 18.2353%)",
      accent: "hsl(217.2414 32.5843% 17.451%)",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Light refreshing theme with coastal blues",
    isPro: true,
    previewColors: {
      background: "hsl(208 100% 97.0588%)",
      primary: "hsl(142.0859 70.5628% 45.2941%)",
      secondary: "hsl(204 93.75% 93.7255%)",
      accent: "hsl(149.2683 80.3922% 90%)",
    },
  },
  {
    id: "doom",
    name: "Doom",
    description: "Intense gaming-inspired dark theme",
    isPro: true,
    previewColors: {
      background: "hsl(0 0% 10.1961%)",
      primary: "hsl(1.3636 77.193% 55.2941%)",
      secondary: "hsl(92.0388 47.907% 42.1569%)",
      accent: "hsl(206.7123 89.0244% 67.8431%)",
    },
  },
  {
    id: "cozy",
    name: "Cozy",
    description: "Warm and comfortable earth tones",
    isPro: true,
    previewColors: {
      background: "hsl(35, 85%, 96%)",
      primary: "hsl(340, 82%, 76%)",
      secondary: "hsl(210, 50%, 94%)",
      accent: "hsl(160, 70%, 85%)",
    },
  },
  {
    id: "nature",
    name: "Nature",
    description: "Fresh greens inspired by nature",
    isPro: true,
    previewColors: {
      background: "hsl(37.5 36.3636% 95.6863%)",
      primary: "hsl(123.038 46.1988% 33.5294%)",
      secondary: "hsl(124.6154 39.3939% 93.5294%)",
      accent: "hsl(122 37.5% 84.3137%)",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristic neon-inspired theme",
    isPro: true,
    previewColors: {
      background: "hsl(250 30% 4%)",
      primary: "hsl(55 100% 50%)",
      secondary: "hsl(180 100% 45%)",
      accent: "hsl(315 95% 55%)",
    },
  },
  {
    id: "amethyst",
    name: "Amethyst",
    description: "Soft lavender with muted elegance",
    isPro: true,
    previewColors: {
      background: "hsl(260 23.0769% 97.451%)",
      primary: "hsl(260.4 22.9358% 57.2549%)",
      secondary: "hsl(258.9474 33.3333% 88.8235%)",
      accent: "hsl(342.4615 56.5217% 77.451%)",
    },
  },
  {
    id: "grove",
    name: "Grove",
    description: "Moody dark with natural greens",
    isPro: true,
    previewColors: {
      background: "hsl(0 0% 7.0588%)",
      primary: "hsl(154.898 100% 19.2157%)",
      secondary: "hsl(0 0% 14.1176%)",
      accent: "hsl(0 0% 19.2157%)",
    },
  },
];

export function ThemesTab({ onUpgradeClick }: ThemesTabProps) {
  const { theme: currentTheme, setTheme } = useTheme();
  const { startPreview } = usePreview();
  const { user } = useUser();
  const { isPro } = useProStatus(user || null);

  const handleApplyTheme = (themeId: Theme) => {
    setTheme(themeId);
  };

  const handlePreviewTheme = (themeId: Theme) => {
    startPreview(themeId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose Your Theme</h2>
        <p className="text-muted-foreground">
          Personalize your Pomodoro experience with beautiful themes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {themeOptions.map((option) => {
          const isCurrentTheme = currentTheme === option.id;
          const canApply = !option.isPro || isPro;

          return (
            <Card
              key={option.id}
              className={`relative transition-all duration-200 ${
                isCurrentTheme
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                    {option.isPro && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                    {isCurrentTheme && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  {option.isPro && !isPro && (
                    <Badge variant="secondary">Pro</Badge>
                  )}
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Color Preview */}
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: option.previewColors.background,
                    }}
                    title="Background"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: option.previewColors.primary,
                    }}
                    title="Primary"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: option.previewColors.secondary,
                    }}
                    title="Secondary"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: option.previewColors.accent,
                    }}
                    title="Accent"
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {canApply ? (
                    <>
                      <Button
                        onClick={() => handleApplyTheme(option.id)}
                        disabled={isCurrentTheme}
                        variant={isCurrentTheme ? "secondary" : "default"}
                        className="w-full"
                      >
                        {isCurrentTheme ? "Applied" : "Apply"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handlePreviewTheme(option.id)}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button disabled variant="outline" className="w-full">
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </Button>
                      <Button
                        onClick={() => handlePreviewTheme(option.id)}
                        variant="default"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isPro && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-amber-900 dark:text-amber-100">
                Unlock Pro Themes
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Get access to all premium themes and other exclusive features with
              Pro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onUpgradeClick} className="w-full md:w-auto">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
