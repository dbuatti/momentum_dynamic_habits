import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { habitColorMap } from '@/lib/habit-utils';

interface QuickLogButtonProps {
  icon: React.ReactNode;
  title: string;
  progress: string;
  isComplete?: boolean;
  variant: 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'indigo';
  route: string;
  state?: object;
  completedColorClass?: string;
  habitKey?: string; // Added habitKey to map colors correctly
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({ 
  icon, 
  title, 
  progress, 
  isComplete, 
  variant, 
  route, 
  state,
  completedColorClass,
  habitKey
}) => {
  const baseClasses = "rounded-2xl p-4 flex flex-col justify-between h-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm";
  
  // Determine the color to use for the border
  const borderColor = habitKey ? habitColorMap[habitKey] : variant;
  const borderClass = `border-4 border-${borderColor}-border`; // Use theme-aware border

  const variantClasses = {
    green: 'bg-habit-green text-habit-green-foreground hover:bg-habit-green/90',
    purple: 'bg-habit-purple text-habit-purple-foreground hover:bg-habit-purple/90',
    orange: 'bg-habit-orange text-habit-orange-foreground hover:bg-habit-orange/90',
    blue: 'bg-habit-blue text-habit-blue-foreground hover:bg-habit-blue/90',
    red: 'bg-habit-red text-habit-red-foreground hover:bg-habit-red/90',
    indigo: 'bg-habit-indigo text-habit-indigo-foreground hover:bg-habit-indigo/90',
  };

  let currentClasses = variantClasses[variant];

  if (isComplete) {
    // If complete, use the success style
    currentClasses = cn("bg-success-background text-success-foreground border-success-border");
  } else {
    // If incomplete, override the border to be red and slightly thicker/more prominent
    currentClasses = cn(currentClasses, "border-4 border-destructive");
  }

  return (
    <Link to={route} state={state} className="h-full block">
      <Card className={cn(baseClasses, currentClasses, "h-full")}>
        <CardContent className="p-0">
          <div className="flex justify-between items-start">
            {isComplete ? (
              <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm">
                <Check className="w-5 h-5 text-success" />
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center">
                {icon}
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <p className="font-bold text-lg">{progress}</p>
            <p className="text-sm mt-1">{title}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};