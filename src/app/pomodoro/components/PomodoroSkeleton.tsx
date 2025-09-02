import { Skeleton } from "@/components/ui/skeleton";

export function PomodoroSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-8 px-4 py-4">
      <div className="text-center">
        {/* Skeleton for Title */}
        <Skeleton className="h-10 w-3/4 mx-auto sm:h-12" />
        {/* Skeleton for Subtitle */}
        <Skeleton className="h-5 w-1/2 mx-auto mt-4 sm:h-6" />
      </div>
      <div className="bg-card/50 backdrop-blur-sm text-card-foreground rounded-2xl shadow-lg border-border/80">
        <div className="text-center space-y-8 p-6 sm:p-10">
          {/* Skeleton for Session Indicators */}
          <div className="flex items-center justify-center space-x-2.5 mb-6">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-3 h-3 rounded-full" />
          </div>

          {/* Skeleton for Timer Display */}
          <Skeleton className="h-24 sm:h-28 md:h-32 w-3/4 mx-auto" />

          {/* Skeleton for Subject Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <div className="flex items-center gap-x-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-10 w-48 rounded-lg" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>

          {/* Skeleton for Control Buttons */}
          <div className="flex items-center justify-center gap-1 md:gap-4 mt-12">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
