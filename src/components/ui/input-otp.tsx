import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cn } from "@/lib/utils";
import { Dot, Minus } from "lucide-react";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2",
      className
    )}
    className={cn("disabled:opacity-50", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const { slots } = React.useContext(OTPInputContext);
  const slot = slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-md border border-[hsl(var(--border))] text-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        slot?.isActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className
      )}
      {...props}
    />
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} className={cn("w-6 text-center text-sm font-medium text-[hsl(var(--muted-foreground))]", ...props)} />
));

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };