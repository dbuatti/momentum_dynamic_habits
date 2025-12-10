import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Zap } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="rounded-2xl shadow-sm border-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBgClass)}>
              {React.cloneElement(icon as React.ReactElement, { 
                className: cn("w-6 h-6", iconTextColorClass) 
              })}
            </div>
            <div>
              <h4 className="font-semibold text-left">
                {title}
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  • {momentum}
                </span>
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
            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <Check className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Completed</span>
            </div>
          )}
        </div>
        
        <div className="mt-5">
          <Progress value={progressValue} className={cn("h-2.5", progressColorClass)} />
          <div className="flex justify-between items-center mt-3">
            <div className="flex space-x-1.5">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2.5 h-2.5 rounded-full", 
                    i < daysCompletedLast7Days ? dotColorClass : "bg-gray-200"
                  )}
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
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-1" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0 text-sm">
              <div className="space-y-2">
                <p>Track your progress and build consistency with this habit.</p>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Zap className="w-3 h-3 mr-1" />
                  <span>Earn XP by completing this habit regularly</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};