import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/80",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80",
        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] border-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/80",
        outline: "text-[hsl(var(--foreground))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };