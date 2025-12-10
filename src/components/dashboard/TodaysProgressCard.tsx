import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface Habit {
  key: string;
  name: string;
  dailyProgress: number;
  dailyGoal: number;
  unit: string;
}

interface TodaysProgressCardProps {
  habits: Habit[];
}

// Map habit keys to Tailwind color classes
const habitColorMap: { [key: string]: string } = {
  pushups: 'habit-orange',
  meditation: 'habit-blue',
  kinesiology: 'habit-green',
  piano: 'habit-purple',
  housework: 'habit-red',
  projectwork: 'habit-indigo',
};

export const TodaysProgressCard: React.FC<TodaysProgressCardProps> = ({ habits }) => {
  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold text-base flex items-center">
          <Zap className="w-4 h-4 mr-2 text-yellow-500" />
          Today's progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        {habits.map((habit) => {
          const progressColorClass = habitColorMap[habit.key] || 'primary';
          const progressValue = (habit.dailyProgress / habit.dailyGoal) * 100;
          const isComplete = habit.dailyProgress >= habit.dailyGoal;
          
          return (
            <div key={habit.key} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full", `bg-${progressColorClass}`)}></div>
                  <span className="font-medium">{habit.name}</span>
                </div>
                <span className={cn(
                  "font-medium",
                  isComplete ? "text-green-600" : "text-foreground"
                )}>
                  {Math.round(habit.dailyProgress)}/{habit.dailyGoal} {habit.unit}
                </span>
              </div>
              <Progress 
                value={progressValue} 
                className={cn("h-2.5", `[&>div]:bg-${progressColorClass}`)} 
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};