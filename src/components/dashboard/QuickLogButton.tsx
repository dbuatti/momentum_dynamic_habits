import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface QuickLogButtonProps {
  icon: React.ReactNode;
  title: string;
  progress: string;
  isComplete?: boolean;
  variant: 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'indigo';
  route: string;
  state?: object;
  completedColorClass?: string;
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({ 
  icon, 
  title, 
  progress, 
  isComplete, 
  variant, 
  route, 
  state,
  completedColorClass 
}) => {
  const baseClasses = "rounded-2xl p-4 flex flex-col justify-between h-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm";
  
  const variantClasses = {
    green: 'bg-habit-green border border-habit-green-border text-habit-green-foreground hover:bg-habit-green/90',
    purple: 'bg-habit-purple border border-habit-purple-border text-habit-purple-foreground hover:bg-habit-purple/90',
    orange: 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100',
    blue: 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100',
    red: 'bg-habit-red border border-habit-red-border text-habit-red-foreground hover:bg-habit-red/90',
    indigo: 'bg-habit-indigo border border-habit-indigo-border text-habit-indigo-foreground hover:bg-habit-indigo/90',
  };

  const currentClasses = isComplete && completedColorClass 
    ? completedColorClass 
    : variantClasses[variant];

  return (
    <Link to={route} state={state} className="h-full block">
      <Card className={cn(baseClasses, currentClasses, "h-full")}>
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