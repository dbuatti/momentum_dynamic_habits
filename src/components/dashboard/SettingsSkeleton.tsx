import { Skeleton } from "@/components/ui/skeleton";

export const SettingsSkeleton = () => (
  <div className="min-h-screen space-y-6 max-w-2xl mx-auto px-4 py-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-10" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-10" />
    </div>
    
    {/* Profile Card */}
    <Skeleton className="h-24 rounded-2xl" />
    
    {/* Profile Information Card */}
    <Skeleton className="h-32 rounded-2xl" />
    
    {/* Appearance Card */}
    <Skeleton className="h-24 rounded-2xl" />
    
    {/* Adaptive Goals Card */}
    <Skeleton className="h-24 rounded-2xl" />
    
    {/* Overview Card */}
    <Skeleton className="h-40 rounded-2xl" />
    
    {/* Push-Ups Journey Card */}
    <Skeleton className="h-48 rounded-2xl" />
    
    {/* Meditation Journey Card */}
    <Skeleton className="h-48 rounded-2xl" />
    
    {/* Badges Card */}
    <Skeleton className="h-64 rounded-2xl" />
    
    {/* Momentum Levels Card */}
    <Skeleton className="h-56 rounded-2xl" />
    
    {/* Timezone Card */}
    <Skeleton className="h-32 rounded-2xl" />
    
    {/* Auto-Schedule Defaults Card */}
    <Skeleton className="h-48 rounded-2xl" />
    
    {/* Lifetime Progress */}
    <Skeleton className="h-32 rounded-2xl" />
    
    {/* Danger Zone Card */}
    <Skeleton className="h-32 rounded-2xl" />
  </div>
);