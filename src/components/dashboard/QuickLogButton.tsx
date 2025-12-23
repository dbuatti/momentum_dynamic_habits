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
  habitKey?: string; 
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({ 
  icon, 
  title, 
  progress, 
  isComplete, 
  variant, 
  route, 
  state,
  habitKey
}) => {
  const baseClasses = "rounded-2xl p-4 flex flex-col justify-between h-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm";
  
  const variantClasses = {
    green: 'bg-habit-green text-habit-green-foreground hover:bg-habit-green/90 border-habit-green-border',
    purple: 'bg-habit-purple text-habit-purple-foreground hover:bg-habit-purple/90 border-habit-purple-border',
    orange: 'bg-habit-orange text-habit-orange-foreground hover:bg-habit-orange/90 border-habit-orange-border',
    blue: 'bg-habit-blue text-habit-blue-foreground hover:bg-habit-blue/90 border-habit-blue-border',
    red: 'bg-habit-red text-habit-red-foreground hover:bg-habit-red/90 border-habit-red-border',
    indigo: 'bg-habit-indigo text-habit-indigo-foreground hover:bg-habit-indigo/90 border-habit-indigo-border',
  };

  let currentClasses = variantClasses[variant];

  if (isComplete) {
    currentClasses = cn("bg-success-background text-success-foreground border-success-border");
  } else {
    // Quality of Life: Stronger border for actionable but incomplete items
    currentClasses = cn(currentClasses, "border-2 opacity-100");
  }

  return (
    <Link to={route} state={state} className="h-full block">
      <Card className={cn(baseClasses, currentClasses, "h-full border-2")}>
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
            <p className="text-sm font-medium mt-1">{title}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};