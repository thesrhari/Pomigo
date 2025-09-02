// components/PlaceholderCard.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Info, LucideIcon } from "lucide-react";

interface PlaceholderCardProps {
  title?: string;
  message: string;
  icon?: LucideIcon;
}

export function PlaceholderCard({
  title,
  message,
  icon: Icon = Info,
}: PlaceholderCardProps) {
  return (
    // REMOVED `h-full` from the parent Card's className
    <Card className="border-2 border-dashed bg-muted/30 hover:border-muted-foreground/50 transition-colors">
      {/* Also removed `h-full` from CardContent to be safe */}
      <CardContent className="flex flex-col items-center justify-center text-center p-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        {title && (
          <h3 className="text-lg font-semibold text-card-foreground">
            {title}
          </h3>
        )}
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
