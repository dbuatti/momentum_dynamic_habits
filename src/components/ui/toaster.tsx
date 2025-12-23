import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export function Toaster() {
  const { theme } = useTheme();
  
  return (
    <SonnerToaster
      theme={theme as any}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[hsl(var(--card))] group-[.toaster]:text-[hsl(var(--card-foreground))] group-[.toaster]:border-[hsl(var(--border))] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[hsl(var(--muted-foreground))]",
          actionButton: "group-[.toast]:bg-[hsl(var(--primary))] group-[.toast]:text-[hsl(var(--primary-foreground))]",
          cancelButton: "group-[.toast]:bg-[hsl(var(--secondary))] group-[.toast]:text-[hsl(var(--secondary-foreground))]",
        },
      }}
    />
  );
}