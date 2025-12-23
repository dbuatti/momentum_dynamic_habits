import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export const DashboardSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const skeletonBg = isDark ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--muted))]";

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className={cn("rounded-2xl p-5", isDark ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--muted))]")}>
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
        <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
        <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
        <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
        <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
      </div>
      
      {/* Level Progress Card */}
      <Skeleton className={cn("h-32 rounded-2xl", skeletonBg)} />
      
      {/* Today's Progress Card */}
      <Skeleton className={cn("h-48 rounded-2xl", skeletonBg)} />
      
      {/* Journey Progress Card */}
      <Skeleton className={cn("h-32 rounded-2xl", skeletonBg)} />
      
      {/* Habit Detail Cards */}
      <Skeleton className={cn("h-40 rounded-2xl", skeletonBg)} />
      <Skeleton className={cn("h-40 rounded-2xl", skeletonBg)} />
      
      {/* Weekly Summary Card */}
      <Skeleton className={cn("h-48 rounded-2xl", skeletonBg)} />
      
      {/* Patterns Card */}
      <Skeleton className={cn("h-40 rounded-2xl", skeletonBg)} />
      
      {/* Next Badge Card */}
      <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
      
      {/* Footer Stats */}
      <Skeleton className={cn("h-64 rounded-2xl", skeletonBg)} />
    </div>
  );
};