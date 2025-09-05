import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * A skeleton loading component for the Analytics Page.
 * It mimics the layout of the page to provide a good user experience while data is loading.
 * The layout is responsive and adapts to different screen sizes.
 */
export const AnalyticsPageSkeleton = () => {
  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8 animate-pulse">
      {/* --- PAGE HEADER SKELETON --- */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-5 w-48 rounded-lg" />
      </div>

      {/* --- FILTERABLE STATS SECTION SKELETON --- */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>

          {/* Bottom Chart and Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart Skeleton */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-48 rounded-lg" />
              </CardHeader>
              <CardContent className="flex items-center justify-center p-6">
                <Skeleton className="h-64 w-64 rounded-full" />
              </CardContent>
            </Card>

            {/* Breakdown Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full rounded-lg" />
                  <Skeleton className="h-5 w-5/6 rounded-lg" />
                  <Skeleton className="h-5 w-full rounded-lg" />
                </div>
                <div className="pt-4 space-y-3">
                  <Skeleton className="h-5 w-40 rounded-lg" />
                  <Skeleton className="h-28 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* --- CONTRIBUTION SECTION SKELETON --- */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-5 w-56 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 pt-0">
          <Skeleton className="h-40 w-full rounded-md" />
          <div className="flex justify-end items-center mt-4">
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* --- INSIGHTS & STREAKS SECTION SKELETON --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fun Stats Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="h-5 w-64 mt-2 rounded-lg" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </CardContent>
        </Card>

        {/* Streaks & Persona Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-24 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-full rounded-lg" />
              <Skeleton className="h-5 w-5/6 rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-5 w-48 rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
