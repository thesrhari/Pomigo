import { Skeleton } from "@/components/ui/skeleton";

export const LeaderboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>

        {/* Filters Skeleton */}
        <div className="bg-card/80 border border-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex rounded-md bg-muted/50 p-1 gap-1">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex rounded-md bg-muted/50 p-1 gap-1">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          </div>
          <div className="text-center mt-3">
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        </div>

        {/* Leaderboard List Skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="flex-shrink-0 relative">
                  <Skeleton className="w-10 h-10 rounded-full" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right flex-shrink-0 space-y-2">
                  <Skeleton className="h-6 w-12 ml-auto" />
                  <Skeleton className="h-3 w-20 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card Skeleton */}
        <div className="bg-card border border-border rounded-lg p-6 sticky bottom-4 shadow-lg">
          <Skeleton className="h-4 w-32 mx-auto mb-3" />
          <div className="flex justify-around items-center text-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
