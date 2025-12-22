import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Zap, Snowflake, Clock, ShieldCheck } from 'lucide-react';
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
  isFrozen?: boolean;
  plateauProgress?: number; // Days completed / Required plateau days
}

export const HabitDetailCard: React.FC<HabitDetailCardProps> = ({ 
  icon, title, momentum, goal, progressText, progressValue, color, 
  isComplete, daysCompletedLast7Days, habitKey, dailyGoal, onCheck,
  isFrozen, plateauProgress = 0
}) => {
  const iconBgClass = {
    orange: 'bg-orange-100', blue: 'bg-blue-100', green: 'bg-habit-green',
    purple: 'bg-habit-purple', red: 'bg-habit-red', indigo: 'bg-habit-indigo',
  }[color];
  
  const iconTextColorClass = {
    orange: 'text-orange-500', blue: 'text-blue-500', green: 'text-habit-green-foreground',
    purple: 'text-habit-purple-foreground', red: 'text-habit-red-foreground', indigo: 'text-habit-indigo-foreground',
  }[color];

  return (
    <Card className="rounded-2xl shadow-sm border-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center relative", iconBgClass)}>
              {React.cloneElement(icon as React.ReactElement, { className: cn("w-6 h-6", iconTextColorClass) })}
              {isFrozen && (
                <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                  <Snowflake className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-left flex items-center">
                {title}
                {isFrozen && <span className="text-[10px] font-bold text-blue-500 ml-2 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Locked</span>}
              </h4>
              <p className="text-sm text-muted-foreground text-left">{goal}</p>
            </div>
          </div>
          
          <HabitCheckButton habitKey={habitKey} isComplete={isComplete} dailyGoal={dailyGoal} onCheck={onCheck} />
        </div>
        
        <div className="mt-5">
          <Progress value={progressValue} className={cn("h-2.5", `[&>div]:bg-habit-${color}`)} />
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Stabilizing goal...</span>
            </div>
            <p className="text-sm font-medium">{progressText}</p>
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full mt-2">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="hover:no-underline p-0 w-full text-sm text-muted-foreground">
              <div className="flex items-center py-2">
                <span>Adaptive Insights</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-1" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-0 text-sm">
              <div className="p-3 bg-muted/40 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Plateau Status</span>
                  <span className="font-bold">Next increase in ~{Math.max(0, 5 - daysCompletedLast7Days)} days</span>
                </div>
                <Progress value={(daysCompletedLast7Days / 5) * 100} className="h-1.5 bg-muted" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Your goal is locked for 5 days of consistency to build automaticity. We only increase when you're 80% consistent.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};