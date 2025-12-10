import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import React from 'react';

interface HabitDetailCardProps {
  icon: React.ReactNode;
  title: string;
  momentum: string;
  goal: string;
  progressText: string;
  progressValue: number;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo'; // Updated to include all habit colors
  isComplete: boolean;
  daysCompletedLast7Days: number; // New prop
}

export const HabitDetailCard: React.FC<HabitDetailCardProps> = ({ icon, title, momentum, goal, progressText, progressValue, color, isComplete, daysCompletedLast7Days }) => {
  // Map color prop to Tailwind classes
  const iconBgClass = {
    orange: 'bg-orange-100',
    blue: 'bg-blue-100',
    green: 'bg-habit-green',
    purple: 'bg-habit-purple',
    red: 'bg-habit-red', // New
    indigo: 'bg-habit-indigo', // New
  }[color];

  const iconTextColorClass = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    green: 'text-habit-green-foreground',
    purple: 'text-habit-purple-foreground',
    red: 'text-habit-red-foreground', // New
    indigo: 'text-habit-indigo-foreground', // New
  }[color];

  const progressColorClass = {
    orange: '[&>div]:bg-habit-orange',
    blue: '[&>div]:bg-habit-blue',
    green: '[&>div]:bg-habit-green',
    purple: '[&>div]:bg-habit-purple',
    red: '[&>div]:bg-habit-red-foreground', // Use foreground color for progress bar
    indigo: '[&>div]:bg-habit-indigo-foreground', // Use foreground color for progress bar
  }[color];

  const dotColorClass = {
    orange: 'bg-habit-orange',
    blue: 'bg-habit-blue',
    green: 'bg-habit-green',
    purple: 'bg-habit-purple',
    red: 'bg-habit-red-foreground', // Use foreground color for dots
    indigo: 'bg-habit-indigo-foreground', // Use foreground color for dots
  }[color];

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1" className="border-none">
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline p-0 w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgClass)}>
                  {React.cloneElement(icon as React.ReactElement, { className: cn("w-5 h-5", iconTextColorClass) })}
                </div>
                <div>
                  <h4 className="font-semibold text-left">{title} <span className="text-xs font-normal text-muted-foreground">• {momentum}</span></h4>
                  <p className="text-sm text-muted-foreground text-left">{goal}</p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 text-muted-foreground" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0">
            <Progress value={progressValue} className={cn("h-2", progressColorClass)} />
            <div className="flex justify-between items-center mt-2">
              <div className="flex space-x-1.5">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={cn("w-2 h-2 rounded-full", i < daysCompletedLast7Days ? dotColorClass : "bg-gray-200")}></div>
                ))}
              </div>
              {isComplete ? (
                <div className="text-sm font-medium text-green-600 flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>done today</span>
                </div>
              ) : (
                <p className="text-sm font-medium">{progressText}</p>
              )}
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
};