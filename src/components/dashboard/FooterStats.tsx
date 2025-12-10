import { Button } from '@/components/ui/button';
import { BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface FooterStatsProps {
  streak: number;
  daysActive: number;
  totalPushups: number;
  totalMeditation: number;
  averageDailyTasks: string;
}

export const FooterStats: React.FC<FooterStatsProps> = ({ 
  streak, 
  daysActive, 
  totalPushups, 
  totalMeditation,
  averageDailyTasks 
}) => (
  <Card className="rounded-2xl shadow-sm border-0 mt-2">
    <CardContent className="p-6">
      <div className="text-center space-y-6">
        <p className="text-muted-foreground italic">
          "You're not behind. You're exactly where you need to be."
        </p>
        
        <div className="flex justify-center">
          <Link to="/history">
            <Button variant="outline" className="rounded-full px-6 py-3 h-auto text-base font-semibold">
              <BarChart className="w-5 h-5 mr-2" /> History
            </Button>
          </Link>
        </div>
        
        <div className="border-t w-full pt-6">
          <div className="flex justify-center space-x-10 text-muted-foreground">
            <div className="text-center">
              <p className="font-bold text-xl text-foreground">{streak}</p>
              <p className="text-xs">streak</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-foreground">{averageDailyTasks}</p>
              <p className="text-xs">avg</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-foreground">{daysActive}</p>
              <p className="text-xs">days</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-12">
          <div>
            <p className="text-3xl font-bold">{totalPushups}</p>
            <p className="text-sm text-muted-foreground">TOTAL PUSH-UPS</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{Math.round(totalMeditation)}m</p>
            <p className="text-sm text-muted-foreground">TOTAL MEDITATION</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);