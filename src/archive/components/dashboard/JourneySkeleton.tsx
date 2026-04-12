import { Skeleton } from "@/components/ui/skeleton";

export const JourneySkeleton = () => (
  <div className="w-full max-w-lg mx-auto space-y-8 px-4 py-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-10" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-10" />
    </div>
    
    {/* Journey Overview Card */}
    <Skeleton className="h-32 rounded-2xl" />
    
    {/* Actionable Insights Card */}
    <Skeleton className="h-40 rounded-2xl" />
    
    {/* Badges & Achievements Card */}
    <Skeleton className="h-48 rounded-2xl" />
    
    {/* Habit Progress Card */}
    <Skeleton className="h-48 rounded-2xl" />
  </div>
);