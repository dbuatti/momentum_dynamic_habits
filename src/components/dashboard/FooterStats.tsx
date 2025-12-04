import { Button } from '@/components/ui/button';
import { BarChart, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterStatsProps {
  streak: number;
  daysActive: number;
  totalPushups: number;
  totalMeditation: number;
}

export const FooterStats: React.FC<FooterStatsProps> = ({ streak, daysActive, totalPushups, totalMeditation }) => (
  <div className="text-center space-y-6 py-8">
    <p className="text-muted-foreground italic">"You're not behind. You're exactly where you need to be."</p>
    <div className="flex justify-center space-x-4">
      <Button variant="outline" className="rounded-full px-6 py-3 h-auto text-base font-semibold"><BarChart className="w-5 h-5 mr-2" /> History</Button>
      {/* Removed Journey button as navigation is now handled by the sidebar */}
    </div>
    <div className="border-t w-1/2 mx-auto pt-6">
      <div className="flex justify-center space-x-8 text-muted-foreground">
        <div className="text-center"><p className="font-bold text-xl text-foreground">{streak}</p><p className="text-xs">streak</p></div>
        <div className="text-center"><p className="font-bold text-xl text-foreground">0</p><p className="text-xs">avg</p></div>
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