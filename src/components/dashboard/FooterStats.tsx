import { Button } from '@/components/ui/button';
import { BarChart, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FooterStats = () => (
  <div className="text-center space-y-6 py-8">
    <p className="text-muted-foreground italic">"You're not behind. You're exactly where you need to be."</p>
    <div className="flex justify-center space-x-4">
      <Button variant="outline" className="rounded-full px-6 py-3 h-auto text-base font-semibold"><BarChart className="w-5 h-5 mr-2" /> History</Button>
      <Link to="/settings">
        <Button variant="outline" className="rounded-full px-6 py-3 h-auto text-base font-semibold"><Settings className="w-5 h-5 mr-2" /> Journey</Button>
      </Link>
    </div>
    <div className="border-t w-1/2 mx-auto pt-6">
      <div className="flex justify-center space-x-8 text-muted-foreground">
        <div className="text-center"><p className="font-bold text-xl text-foreground">0</p><p className="text-xs">streak</p></div>
        <div className="text-center"><p className="font-bold text-xl text-foreground">0</p><p className="text-xs">avg</p></div>
        <div className="text-center"><p className="font-bold text-xl text-foreground">7</p><p className="text-xs">days</p></div>
      </div>
    </div>
    <div className="flex justify-center space-x-8">
      <div>
        <p className="text-3xl font-bold">62</p>
        <p className="text-sm text-muted-foreground">TOTAL PUSH-UPS</p>
      </div>
      <div>
        <p className="text-3xl font-bold">0h 28m</p>
        <p className="text-sm text-muted-foreground">TOTAL MEDITATION</p>
      </div>
    </div>
  </div>
);