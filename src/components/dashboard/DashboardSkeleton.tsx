import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="p-4 space-y-6 max-w-lg mx-auto w-full animate-pulse">
    <div className="flex justify-between items-start">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="w-10 h-10 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    <Skeleton className="h-12 rounded-2xl" />
    <Skeleton className="h-28 rounded-2xl" />
    <Skeleton className="h-24 rounded-2xl" />
    <Skeleton className="h-40 rounded-2xl" />
    <Skeleton className="h-40 rounded-2xl" />
  </div>
);