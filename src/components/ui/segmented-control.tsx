"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlOption {
  label: string;
  value: string;
  icon?: React.ElementType;
}

interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
}

export const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ className, options, value, onValueChange, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              isSelected && "bg-background text-foreground shadow-sm"
            )}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
});
SegmentedControl.displayName = "SegmentedControl";