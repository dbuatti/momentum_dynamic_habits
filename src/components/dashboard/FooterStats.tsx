import { Button } from '@/components/ui/button';
import { BarChart } from 'lucide-react'; // Removed Settings as it's not used here
import { Link } from 'react-router-dom';

interface FooterStatsProps {
  streak: number;
  daysActive: number;
  totalPushups: number;
  totalMeditation: number;
  averageDailyTasks: string; // New prop for average daily tasks
}

export const FooterStats: React.FC<FooterStatsProps> = ({ streak, daysActive, totalPushups, totalMeditation, averageDailyTasks }) => (
  <div className="text-center space-y-6 py-8">
    <p className="text-muted-foreground italic">"You're not behind. You're exactly where you need to be."</p>
    <div className="flex justify-center space-x-4">
      <Link to="/history"> {/* Link to the new History page */}
        <Button variant="outline" className="rounded-full px-6 py-3 h-auto text-base font-semibold"><BarChart className="w-5 h-5 mr-2" /> History</Button>
      </Link>
    </div>
    <div className="border-t w-1/2 mx-auto pt-6">
      <div className="flex justify-center space-x-8 text-muted-foreground">
        <div className="text-center"><p className="font-bold text-xl text-foreground">{streak}</p><p className="text-xs">streak</p></div>
        <div className="text-center"><p className="font-bold text-xl text-foreground">{averageDailyTasks}</p><p className="text-xs">avg</p></div> {/* Display average daily tasks */}
        <div className="text-center"><p className="font-bold text-xl text-foreground">{daysActive}</p><p className="text-xs">days</p></div>
      </div>
    </div>
    <div className="flex justify-center space-x-8">
      <div>
        <p className="text-3xl font-bold">{totalPushups}</p>
        <p className="text-sm text-muted-foreground">TOTAL PUSH-UPS</p>
      </div>
      <div>
        <p className="text-3xl font-bold">{totalMeditation}m</p>
        <p className="text-sm text-muted-foreground">TOTAL MEDITATION</p>
      </div>
    </div>
  </div>
);