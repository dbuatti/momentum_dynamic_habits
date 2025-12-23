import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const pushupChange = calculatePercentageChange(summary.pushups.current, summary.pushups.previous);
  const meditationChange = calculatePercentageChange(summary.meditation.current, summary.meditation.previous);
  
  const isPushupImproving = summary.pushups.current >= summary.pushups.previous;
  const isMeditationImproving = summary.meditation.current >= summary.meditation.previous;
  
  const isActiveWeek = summary.activeDays >= 5;

  // Theme-aware colors
  const headerText = "text-[hsl(var(--foreground))]";
  const subText = "text-[hsl(var(--muted-foreground))]";
  const pushupColor = isPushupImproving ? "text-[hsl(var(--habit-green-foreground))]" : "text-[hsl(var(--habit-red-foreground))]";
  const meditationColor = isMeditationImproving ? "text-[hsl(var(--habit-green-foreground))]" : "text-[hsl(var(--habit-red-foreground))]";
  const activeColor = isActiveWeek ? "text-[hsl(var(--habit-green-foreground))] font-medium" : subText;

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className={cn("font-semibold flex items-center", headerText)}>
          <Flame className="w-4 h-4 mr-2 text-orange-500" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className={cn("text-sm", subText)}>Push-ups</p>
            <p className="text-3xl font-bold mt-1">{summary.pushups.current}</p>
            <div className={cn("flex items-center text-sm font-medium mt-1", pushupColor)}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{pushupChange}% vs last week</span>
            </div>
          </div>
          <div>
            <p className={cn("text-sm", subText)}>Meditation</p>
            <p className="text-3xl font-bold mt-1">{Math.round(summary.meditation.current)}m</p>
            <div className={cn("flex items-center text-sm font-medium mt-1", meditationColor)}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{meditationChange}% vs last week</span>
            </div>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <div className="flex space-x-1.5 text-[hsl(var(--habit-green-foreground))] mb-2">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-3 h-3 rounded-full", 
                  i < summary.activeDays ? "bg-current" : "bg-[hsl(var(--border))]"
                )}
              ></div>
            ))}
          </div>
          <p className={cn("text-sm", headerText)}>
            <span className="font-medium">{summary.activeDays}/7</span> days active
          </p>
          <p className={cn("text-sm mt-1", activeColor)}>
            {isActiveWeek ? "🔥 Incredible consistency this week!" : "Keep going to build momentum!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};