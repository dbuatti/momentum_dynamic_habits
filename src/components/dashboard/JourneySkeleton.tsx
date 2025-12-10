import { Skeleton } from "@/components/ui/skeleton";

export const JourneySkeleton = () => (
  <div className="w-full max-w-lg mx-auto space-y-8 animate-pulse">
    <Skeleton className="h-10 w-3/4 mx-auto mb-2" />
    <Skeleton className="h-6 w-1/2 mx-auto" />
    
    {/* Actionable Insights Card Skeleton */}
    <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-16 w-full rounded-md" />
    </div>

    {/* Badges & Achievements Card Skeleton */}
    <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
      <Skeleton className="h-6 w-56" />
      <div className="flex items-center space-x-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-grow space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-2 flex-grow" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);