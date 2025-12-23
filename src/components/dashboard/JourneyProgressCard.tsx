import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain, Calendar } from 'lucide-react';

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
  const progress = totalJourneyDays > 0 ? (daysActive / totalJourneyDays) * 100 : 0;
  
  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardContent className="p-5">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold flex items-center">
            <Mountain className="w-4 h-4 mr-2 text-muted-foreground" />
            Day {daysActive}
            <span className="font-normal text-muted-foreground ml-1">of {totalJourneyDays}</span>
          </h3>
          <p className="text-sm text-muted-foreground flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            {daysToNextMonth} days to 1 month
          </p>
        </div>
        
        <div className="relative my-4">
          <Progress value={progress} className="h-2.5" />
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0.5">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-background rounded-full border border-muted"
              ></div>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {Math.floor(daysActive / 7)} week in • keep going
        </p>
      </CardContent>
    </Card>
  );
};