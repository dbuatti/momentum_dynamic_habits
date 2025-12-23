import { cn } from "@/lib/utils";
import { useTheme } from '@/contexts/ThemeContext';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        isDark ? "bg-[hsl(var(--muted))]" : "bg-[hsl(var(--muted))]",
        className
      )}
      {...props}
    />
  );
};

export { Skeleton };