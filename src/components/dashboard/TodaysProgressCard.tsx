import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Habit {
  key: string; // Added key for mapping
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
};

export const TodaysProgressCard: React.FC<TodaysProgressCardProps> = ({ habits }) => {
  return (
    <div className="bg-card rounded-2xl p-4 space-y-3 shadow-sm">
      <h3 className="font-semibold text-base">Today's progress</h3>
      {habits.map((habit) => {
        const progressColorClass = habitColorMap[habit.key] || 'primary'; // Fallback to primary
        const progressValue = (habit.dailyProgress / habit.dailyGoal) * 100;
        return (
          <div key={habit.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className={cn("w-2 h-2 rounded-full", `bg-${progressColorClass}`)}></div>
                <span>{habit.name}</span>
              </div>
              <span className="font-medium text-foreground">{Math.round(habit.dailyProgress)}/{habit.dailyGoal} {habit.unit}</span>
            </div>
            <Progress value={progressValue} className={cn("h-2", `[&>div]:bg-${progressColorClass}`)} />
          </div>
        );
      })}
    </div>
  );
};