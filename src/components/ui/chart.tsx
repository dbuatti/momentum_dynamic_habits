import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { id?: string }
>(({ id, className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-full", className)}
    {...props}
  >
    <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
      {children as React.ReactElement}
    </RechartsPrimitive.ResponsiveContainer>
  </div>
));
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = React.forwardRef<
  React.ElementRef<typeof RechartsPrimitive.Tooltip>,
  React.ComponentPropsWithoutRef<typeof RechartsPrimitive.Tooltip>
>(({ ...props }, ref) => (
  <RechartsPrimitive.Tooltip
    ref={ref}
    content={({ active, payload, label }) => {
      if (!active || !payload) return null;
      return (
        <div className="rounded-lg border bg-[hsl(var(--card))] p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-[hsl(var(--muted-foreground))]">
                {label}
              </span>
              <span className="font-bold text-[hsl(var(--foreground))]">
                {payload[0]?.value}
              </span>
            </div>
          </div>
        </div>
      );
    }}
    {...props}
  />
));
ChartTooltip.displayName = "ChartTooltip";

const ChartLegend = React.forwardRef<
  React.ElementRef<typeof RechartsPrimitive.Legend>,
  React.ComponentPropsWithoutRef<typeof RechartsPrimitive.Legend>
>(({ ...props }, ref) => (
  <RechartsPrimitive.Legend
    ref={ref}
    content={({ payload }) => {
      if (!payload) return null;
      return (
        <div className="mt-2 flex items-center justify-center gap-4">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }}
    {...props}
  />
));
ChartLegend.displayName = "ChartLegend";

export { ChartContainer, ChartTooltip, ChartLegend };