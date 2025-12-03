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
  color: 'orange' | 'blue';
  isComplete: boolean;
}

export const HabitDetailCard: React.FC<HabitDetailCardProps> = ({ icon, title, momentum, goal, progressText, progressValue, color, isComplete }) => {
  const progressColorClass = color === 'orange' ? '[&>div]:bg-habit-orange' : '[&>div]:bg-habit-blue';

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1" className="border-none">
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <AccordionTrigger className="hover:no-underline p-0 w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color === 'orange' ? 'bg-orange-100' : 'bg-blue-100')}>
                  {icon}
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
                  <div key={i} className={cn("w-2 h-2 rounded-full", i < 5 ? (color === 'orange' ? 'bg-habit-orange' : 'bg-habit-blue') : 'bg-gray-200')}></div>
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