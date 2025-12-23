import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-[hsl(var(--border))]",
        destructive: "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] border-[hsl(var(--destructive))]",
        success: "bg-[hsl(var(--habit-green))] text-[hsl(var(--habit-green-foreground))] border-[hsl(var(--habit-green-border))]",
        error: "bg-[hsl(var(--habit-red))] text-[hsl(var(--habit-red-foreground))] border-[hsl(var(--habit-red-border))]",
        info: "bg-[hsl(var(--habit-blue))] text-[hsl(var(--habit-blue-foreground))] border-[hsl(var(--habit-blue-border))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  const Icon = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[variant || "default"];

  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div className="flex flex-col">
          <ToastPrimitive.Title className="text-sm font-semibold" />
          <ToastPrimitive.Description className="text-sm opacity-90" />
        </div>
      </div>
      <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.toaster]:opacity-100">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastProvider = ToastPrimitive.Provider;
const ToastTitle = ToastPrimitive.Title;
const ToastDescription = ToastPrimitive.Description;
const ToastAction = ToastPrimitive.Action;
const ToastClose = ToastPrimitive.Close;

export {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
};