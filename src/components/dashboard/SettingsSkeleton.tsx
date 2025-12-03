import { Skeleton } from "@/components/ui/skeleton";

export const SettingsSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-black p-4 space-y-6 max-w-2xl mx-auto animate-pulse">
    <div className="flex items-center justify-between border-b pb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="w-10 h-10 rounded-full" />
    </div>

    <Skeleton className="h-24 rounded-xl" /> {/* User Profile Card */}
    <Skeleton className="h-28 rounded-xl" /> {/* Adaptive Goals */}
    <Skeleton className="h-40 rounded-xl" /> {/* Overview */}
    <Skeleton className="h-48 rounded-xl" /> {/* Push-Ups Journey */}
    <Skeleton className="h-48 rounded-xl" /> {/* Meditation Journey */}
    <Skeleton className="h-64 rounded-xl" /> {/* Badges */}
    <Skeleton className="h-64 rounded-xl" /> {/* Momentum Levels */}
    <Skeleton className="h-40 rounded-xl" /> {/* Meditation Sound */}
    <Skeleton className="h-32 rounded-xl" /> {/* Lifetime Progress */}
    <Skeleton className="h-32 rounded-xl" /> {/* Danger Zone */}
  </div>
);