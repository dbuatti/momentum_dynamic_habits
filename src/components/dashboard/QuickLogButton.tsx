import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface QuickLogButtonProps {
  icon: React.ReactNode;
  title: string;
  progress: string;
  isComplete?: boolean;
  variant: 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'indigo'; // Updated to include all habit colors
  route: string;
  state?: object;
  completedColorClass?: string; // New prop for completed state styling
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({ icon, title, progress, isComplete, variant, route, state, completedColorClass }) => {
  const baseClasses = "rounded-2xl p-3 flex flex-col justify-between h-24 text-left";
  
  const variantClasses = {
    green: 'bg-habit-green border border-habit-green-border text-habit-green-foreground',
    purple: 'bg-habit-purple border border-habit-purple-border text-habit-purple-foreground',
    orange: 'bg-orange-50 border border-orange-200 text-orange-700', // Using direct Tailwind for orange
    blue: 'bg-blue-50 border border-blue-200 text-blue-700', // Using direct Tailwind for blue
    red: 'bg-habit-red border border-habit-red-border text-habit-red-foreground', // New
    indigo: 'bg-habit-indigo border border-habit-indigo-border text-habit-indigo-foreground', // New
  };

  const currentClasses = isComplete && completedColorClass 
    ? completedColorClass 
    : variantClasses[variant];

  return (
    <Link to={route} state={state} className={cn(baseClasses, currentClasses)}>
      <div className="flex justify-between items-start">
        {isComplete ? <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><Check className="w-4 h-4 text-green-600" /></div> : icon}
      </div>
      <div>
        <p className="font-bold text-base">{progress}</p>
        <p className="text-xs">{title}</p>
      </div>
    </Link>
  );
};