import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Page Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-1/2 rounded-md" />
        <Skeleton className="mt-2 h-5 w-3/4 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4 rounded-md" />
              <Skeleton className="mt-2 h-4 w-2/3 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-32 rounded-md" />
                  <Skeleton className="h-4 w-48 rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-[120px] w-full rounded-md" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Skeleton className="h-10 w-28 rounded-md" />
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded-md" />
              <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded-md" />
              <Skeleton className="mt-2 h-4 w-1/2 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded-md" />
              <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
