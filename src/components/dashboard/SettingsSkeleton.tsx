import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export const SettingsSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const skeletonBg = isDark ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--muted))]";

  return (
    <div className="min-h-screen space-y-6 max-w-2xl mx-auto px-4 py-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-10" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-10" />
      </div>
      
      {/* Profile Card */}
      <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
      
      {/* Profile Information Card */}
      <Skeleton className={cn("h-32 rounded-2xl", skeletonBg)} />
      
      {/* Appearance Card */}
      <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
      
      {/* Adaptive Goals Card */}
      <Skeleton className={cn("h-24 rounded-2xl", skeletonBg)} />
      
      {/* Overview Card */}
      <Skeleton className={cn("h-40 rounded-2xl", skeletonBg)} />
      
      {/* Push-Ups Journey Card */}
      <Skeleton className={cn("h-48 rounded-2xl", skeletonBg)} />
      
      {/* Meditation Journey Card */}
      <Skeleton className={cn("h-48 rounded-2xl", skeletonBg)} />
      
      {/* Badges Card */}
      <Skeleton className={cn("h-64 rounded-2xl", skeletonBg)} />
      
      {/* Momentum Levels Card */}
      <Skeleton className={cn("h-56 rounded-2xl", skeletonBg)} />
      
      {/* Timezone Card */}
      <Skeleton className={cn("h-32 rounded-2xl", skeletonBg)} />
      
      {/* Auto-Schedule Defaults Card */}
      <Skeleton className={cn("h-48 rounded-2xl", skeletonBg)} />
      
      {/* Lifetime Progress */}
      <Skeleton className={cn("h-32 rounded-2xl", skeletonBg)} />
      
      {/* Danger Zone Card */}
      <Skeleton className={cn("h-32 rounded-2xl", skeletonBg)} />
    </div>
  );
};