import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface QuickLogButtonProps {
  icon: React.ReactNode;
  title: string;
  progress: string;
  isComplete?: boolean;
  variant: 'green' | 'purple';
  route: string;
  state?: object;
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({ icon, title, progress, isComplete, variant, route, state }) => {
  const baseClasses = "rounded-2xl p-3 flex flex-col justify-between h-24 text-left";
  const variantClasses = {
    green: 'bg-habit-green border border-habit-green-border text-habit-green-foreground',
    purple: 'bg-habit-purple border border-habit-purple-border text-habit-purple-foreground',
  };

  return (
    <Link to={route} state={state} className={cn(baseClasses, variantClasses[variant])}>
      <div className="flex justify-between items-start">
        {isComplete ? <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><Check className="w-4 h-4 text-habit-green-foreground" /></div> : icon}
      </div>
      <div>
        <p className="font-bold text-base">{progress}</p>
        <p className="text-xs">{title}</p>
      </div>
    </Link>
  );
};