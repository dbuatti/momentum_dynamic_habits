import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface WeeklySummaryCardProps {
  summary: {
    pushups: {
      current: number;
      previous: number;
    };
    meditation: {
      current: number;
      previous: number;
    };
    activeDays: number;
  };
}

const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? '∞' : '0';
  return Math.round(((current - previous) / previous) * 100);
};

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ summary }) => {
  const pushupChange = calculatePercentageChange(summary.pushups.current, summary.pushups.previous);
  const meditationChange = calculatePercentageChange(summary.meditation.current, summary.meditation.previous);
  
  const isPushupImproving = summary.pushups.current >= summary.pushups.previous;
  const isMeditationImproving = summary.meditation.current >= summary.meditation.previous;
  
  const isActiveWeek = summary.activeDays >= 5;

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold flex items-center">
          <Flame className="w-4 h-4 mr-2 text-warning" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Push-ups</p>
            <p className="text-3xl font-bold mt-1">{summary.pushups.current}</p>
            <div className={cn(
              "flex items-center text-sm font-medium mt-1",
              isPushupImproving ? "text-success-foreground" : "text-destructive-foreground"
            )}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{pushupChange}% vs last week</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Meditation</p>
            <p className="text-3xl font-bold mt-1">{Math.round(summary.meditation.current)}m</p>
            <div className={cn(
              "flex items-center text-sm font-medium mt-1",
              isMeditationImproving ? "text-success-foreground" : "text-destructive-foreground"
            )}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{meditationChange}% vs last week</span>
            </div>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <div className="flex space-x-1.5 text-success mb-2">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-3 h-3 rounded-full", 
                  i < summary.activeDays ? "bg-current" : "bg-secondary"
                )}
              ></div>
            ))}
          </div>
          <p className="text-sm">
            <span className="font-medium">{summary.activeDays}/7</span> days active
          </p>
          <p className={cn(
            "text-sm mt-1",
            isActiveWeek ? "text-success-foreground font-medium" : "text-muted-foreground"
          )}>
            {isActiveWeek ? "🔥 Incredible consistency this week!" : "Keep going to build momentum!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};