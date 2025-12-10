import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import React from 'react';
import { HabitCheckButton } from './HabitCheckButton';

interface HabitDetailCardProps {
  icon: React.ReactNode;
  title: string;
  momentum: string;
  goal: string;
  progressText: string;
  progressValue: number;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo';
  isComplete: boolean;
  daysCompletedLast7Days: number;
  habitKey: string;
  dailyGoal: number;
  onCheck: () => void;
}

export const HabitDetailCard: React.FC<HabitDetailCardProps> = ({
  icon,
  title,
  momentum,
  goal,
  progressText,
  progressValue,
  color,
  isComplete,
  daysCompletedLast7Days,
  habitKey,
  dailyGoal,
  onCheck
}) => {
  // Map color prop to Tailwind classes
  const iconBgClass = {
    orange: 'bg-orange-100',
    blue: 'bg-blue-100',
    green: 'bg-habit-green',
    purple: 'bg-habit-purple',
    red: 'bg-habit-red',
    indigo: 'bg-habit-indigo',
  }[color];

  const iconTextColorClass = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    green: 'text-habit-green-foreground',
    purple: 'text-habit-purple-foreground',
    red: 'text-habit-red-foreground',
    indigo: 'text-habit-indigo-foreground',
  }[color];

  const progressColorClass = {
    orange: '[&>div]:bg-habit-orange',
    blue: '[&>div]:bg-habit-blue',
    green: '[&>div]:bg-habit-green',
    purple: '[&>div]:bg-habit-purple',
    red: '[&>div]:bg-habit-red-foreground',
    indigo: '[&>div]:bg-habit-indigo-foreground',
  }[color];

  const dotColorClass = {
    orange: 'bg-habit-orange',
    blue: 'bg-habit-blue',
    green: 'bg-habit-green',
    purple: 'bg-habit-purple',
    red: 'bg-habit-red-foreground',
    indigo: 'bg-habit-indigo-foreground',
  }[color];

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgClass)}>
            {React.cloneElement(icon as React.ReactElement, { className: cn("w-5 h-5", iconTextColorClass) })}
          </div>
          <div>
            <h4 className="font-semibold text-left">{title} 
              <span className="text-xs font-normal text-muted-foreground"> • {momentum}</span>
            </h4>
            <p className="text-sm text-muted-foreground text-left">{goal}</p>
          </div>
        </div>
        {!isComplete ? (
          <HabitCheckButton 
            habitKey={habitKey} 
            isComplete={isComplete} 
            dailyGoal={dailyGoal} 
            onCheck={onCheck} 
          />
        ) : (
          <div className="flex items-center text-green-600">
            <Check className="w-4 h-4 mr-1" />
            <span className="text-xs">Completed</span>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <Progress value={progressValue} className={cn("h-2", progressColorClass)} />
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-1.5">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={cn("w-2 h-2 rounded-full", i < daysCompletedLast7Days ? dotColorClass : "bg-gray-200")}
              ></div>
            ))}
          </div>
          <p className="text-sm font-medium">{progressText}</p>
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full mt-4">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="hover:no-underline p-0 w-full text-sm text-muted-foreground">
            <div className="flex items-center">
              <span>View details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0 text-sm">
            <div className="space-y-2">
              <p>Track your progress and build consistency with this habit.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};