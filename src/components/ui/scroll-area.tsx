import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative flex-1 overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar
      orientation="vertical"
      className={cn(
        "flex touch-none select-none border-l border-l-transparent p-[1px]",
        "bg-[hsl(var(--border))]"
      )}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Scrollbar
      orientation="horizontal"
      className={cn(
        "flex touch-none select-none border-t border-t-transparent p-[1px]",
        "bg-[hsl(var(--border))]"
      )}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-[hsl(var(--muted-foreground))]" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Corner className="bg-[hsl(var(--border))]" />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export { ScrollArea };