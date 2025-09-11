"use client";

import { usePreview } from "@/components/PreviewProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, X } from "lucide-react";

export default function PreviewIndicator() {
  const { isPreviewMode, previewTheme, previewTimeLeft, exitPreview } =
    usePreview();

  if (!isPreviewMode) {
    return null;
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-5 bg-background/90 backdrop-blur-md rounded-full py-3 px-4 shadow-2xl border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-base leading-none">Preview Mode</p>
            <p className="text-sm text-muted-foreground">
              Viewing &quot;{previewTheme}&quot;
            </p>
          </div>
        </div>

        <div className="w-px h-10 bg-border" />

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary tabular-nums leading-none">
              {previewTimeLeft}
            </div>
            <div className="text-xs text-muted-foreground tracking-widest">
              SECONDS
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exitPreview}
                  className="rounded-full w-9 h-9"
                >
                  <X className="w-5 h-5" />
                  <span className="sr-only">Exit Preview</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exit Preview Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
