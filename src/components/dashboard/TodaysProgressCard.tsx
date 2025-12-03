import { Progress } from '@/components/ui/progress';

interface Habit {
  name: string;
  dailyProgress: number;
  dailyGoal: number;
  unit: string;
}

interface TodaysProgressCardProps {
  pushups?: Habit;
  meditation?: Habit;
}

export const TodaysProgressCard: React.FC<TodaysProgressCardProps> = ({ pushups, meditation }) => {
  return (
    <div className="bg-card rounded-2xl p-4 space-y-3 shadow-sm">
      <h3 className="font-semibold text-base">Today's progress</h3>
      {pushups && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-habit-orange"></div>
              <span>{pushups.name}</span>
            </div>
            <span className="font-medium text-foreground">{pushups.dailyProgress}/{pushups.dailyGoal}</span>
          </div>
          <Progress value={(pushups.dailyProgress / pushups.dailyGoal) * 100} className="h-2 [&>div]:bg-habit-orange" />
        </div>
      )}
      {meditation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-habit-blue"></div>
              <span>{meditation.name}</span>
            </div>
            <span className="font-medium text-foreground">{meditation.dailyProgress}/{meditation.dailyGoal}{meditation.unit}</span>
          </div>
          <Progress value={(meditation.dailyProgress / meditation.dailyGoal) * 100} className="h-2 [&>div]:bg-habit-blue" />
        </div>
      )}
    </div>
  );
};