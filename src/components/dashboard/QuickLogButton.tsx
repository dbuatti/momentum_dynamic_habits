import { cn, getHabitColorClasses } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

interface QuickLogButtonProps {
  icon: React.ReactNode;
  title: string;
  progress: string;
  isComplete?: boolean;
  route: string;
  state?: object;
  habitKey?: string;
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({ 
  icon, 
  title, 
  progress, 
  isComplete, 
  route, 
  state,
  habitKey
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const baseClasses = "rounded-2xl p-4 flex flex-col justify-between h-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm";
  
  // Get theme-aware color classes
  const colorClasses = habitKey ? getHabitColorClasses(habitKey, isDark) : null;

  const containerClasses = cn(
    baseClasses,
    isComplete 
      ? "bg-muted/30 border-muted opacity-70" 
      : colorClasses 
        ? cn(colorClasses.bg, colorClasses.border, "border-4")
        : "bg-primary/5 border-primary/20 border-4"
  );

  return (
    <Link to={route} state={state} className="h-full block">
      <Card className={containerClasses}>
        <CardContent className="p-0">
          <div className="flex justify-between items-start">
            {isComplete ? (
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Check className="w-5 h-5 text-green-600" />
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