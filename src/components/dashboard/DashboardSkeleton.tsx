import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="space-y-6 max-w-lg mx-auto w-full animate-pulse">
    {/* Header Skeleton */}
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="w-14 h-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
    
    {/* Quick Log Buttons */}
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    
    {/* Level Progress Card */}
    <Skeleton className="h-32 rounded-2xl" />
    
    {/* Today's Progress Card */}
    <Skeleton className="h-48 rounded-2xl" />
    
    {/* Journey Progress Card */}
    <Skeleton className="h-32 rounded-2xl" />
    
    {/* Habit Detail Cards */}
    <Skeleton className="h-40 rounded-2xl" />
    <Skeleton className="h-40 rounded-2xl" />
    
    {/* Weekly Summary Card */}
    <Skeleton className="h-48 rounded-2xl" />
    
    {/* Patterns Card */}
    <Skeleton className="h-40 rounded-2xl" />
    
    {/* Next Badge Card */}
    <Skeleton className="h-24 rounded-2xl" />
    
    {/* Footer Stats */}
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);