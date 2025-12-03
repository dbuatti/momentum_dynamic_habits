import React from 'react';
import { Habit, PianoHabit, MomentumLevel } from '../types/habit';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock, Dumbbell, BookOpen, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HabitCardProps {
  habit: Habit | PianoHabit;
}

const getIcon = (id: string) => {
  switch (id) {
    case 'pushups':
      return Dumbbell;
    case 'meditation':
      return Clock;
    case 'kinesiology':
      return BookOpen;
    case 'piano':
      return Music;
    default:
      return Clock;
  }
};

const getMomentumColor = (momentum: MomentumLevel) => {
  switch (momentum) {
    case 'Crushing':
      return 'bg-green-600 hover:bg-green-700';
    case 'Strong':
      return 'bg-blue-600 hover:bg-blue-700';
    case 'Building':
      return 'bg-yellow-600 hover:bg-yellow-700';
    case 'Struggling':
      return 'bg-red-600 hover:bg-red-700';
    default:
      return 'bg-gray-600';
  }
};

const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const Icon = getIcon(habit.id);
  const progressPercentage = Math.min(100, (habit.currentProgress / habit.targetGoal) * 100);
  const isComplete = habit.currentProgress >= habit.targetGoal;

  const displayProgress = habit.type === 'time'
    ? `${habit.currentProgress} / ${habit.targetGoal} ${habit.unit}`
    : `${habit.currentProgress} / ${habit.targetGoal} ${habit.unit}`;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={habit.id} className="border rounded-lg shadow-sm bg-card px-4 mb-2">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">{habit.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {isComplete && <Badge variant="default" className="bg-green-500">Done</Badge>}
              <span className="text-sm text-muted-foreground">{displayProgress}</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-4">
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Goal: {habit.targetGoal} {habit.unit}</span>
              <Badge className={cn("text-xs text-white", getMomentumColor(habit.momentum))}>
                Momentum: {habit.momentum}
              </Badge>
            </div>

            {habit.id === 'piano' && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">Target Songs:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {(habit as PianoHabit).targetSongs.map((song, index) => (
                    <li key={index} className={cn((habit as PianoHabit).songsCompletedToday.includes(song) ? 'line-through text-green-600 dark:text-green-400' : '')}>
                      {song}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {habit.id === 'kinesiology' && (
              <div className="mt-2 p-3 bg-accent rounded-md border border-border">
                <p className="text-sm font-medium text-accent-foreground">
                  Action Prompt: Go to your desk.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Link to={habit.route}>
                <Button variant="secondary" size="sm">
                  Log More
                </Button>
              </Link>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default HabitCard;