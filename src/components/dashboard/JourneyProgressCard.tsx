import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface JourneyProgressCardProps {
  daysActive: number;
  totalJourneyDays: number;
  daysToNextMonth: number;
}

export const JourneyProgressCard: React.FC<JourneyProgressCardProps> = ({ 
  daysActive, 
  totalJourneyDays, 
  daysToNextMonth 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const progress = totalJourneyDays > 0 ? (daysActive / totalJourneyDays) * 100 : 0;
  
  // Theme-aware colors
  const headerText = "text-[hsl(var(--foreground))]";
  const subText = "text-[hsl(var(--muted-foreground))]";
  const progressColor = "[&>div]:bg-[hsl(var(--primary))]";

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardContent className="p-5">
        <div className="flex justify-between items-baseline">
          <h3 className={cn("font-semibold flex items-center", headerText)}>
            <Mountain className="w-4 h-4 mr-2 text-[hsl(var(--muted-foreground))]" />
            Day {daysActive}
            <span className={cn("font-normal ml-1", subText)}>of {totalJourneyDays}</span>
          </h3>
          <p className={cn("text-sm flex items-center", subText)}>
            <Calendar className="w-3.5 h-3.5 mr-1" />
            {daysToNextMonth} days to 1 month
          </p>
        </div>
        
        <div className="relative my-4">
          <Progress value={progress} className={cn("h-2.5", progressColor)} />
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0.5">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-[hsl(var(--background))] rounded-full border border-[hsl(var(--border))]"
              ></div>
            ))}
          </div>
        </div>
        
        <p className={cn("text-sm", subText)}>
          {Math.floor(daysActive / 7)} week in • keep going
        </p>
      </CardContent>
    </Card>
  );
};