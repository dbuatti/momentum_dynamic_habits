import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { VariantProps } from "class-variance-authority";
import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, children, size = "default", ...props }, ref) => (
  <ToggleGroupContext.Provider value={{ size }}>
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  </ToggleGroupContext.Provider>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  if (!context) {
    throw new Error("ToggleGroupItem must be used within ToggleGroup");
  }

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleVariants({ size: context.size, className }))}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };