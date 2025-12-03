import { Progress } from '@/components/ui/progress';
import { Dumbbell, Wind } from 'lucide-react';

export const TodaysProgressCard = () => {
  return (
    <div className="bg-card rounded-2xl p-4 space-y-3 shadow-sm">
      <h3 className="font-semibold text-base">Today's progress</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-habit-orange"></div>
            <span>Push-ups</span>
          </div>
          <span className="font-medium text-foreground">17/8</span>
        </div>
        <Progress value={(17/8)*100} className="h-2 [&>div]:bg-habit-orange" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-habit-blue"></div>
            <span>Breathe</span>
          </div>
          <span className="font-medium text-foreground">2/4m</span>
        </div>
        <Progress value={(2/4)*100} className="h-2 [&>div]:bg-habit-blue" />
      </div>
    </div>
  );
};