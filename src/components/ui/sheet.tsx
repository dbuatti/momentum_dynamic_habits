import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const SheetPortal = ({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) => (
  <SheetPrimitive.Portal className={cn(className)} {...props} />
);
SheetPortal.displayName = SheetPrimitive.Portal.displayName;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-[hsl(var(--background))]/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, side = "right", ...props }, ref) => (
  <SheetPrimitive.Content
    ref={ref}
    className={cn(
      "fixed inset-y-0 z-50 h-full gap-4 border bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-xl transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-xl",
      side === "left" && "left-0 border-r",
      side === "right" && "right-0 border-l",
      className
    )}
    {...props}
  >
    {children}
  </SheetPrimitive.Content>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent };