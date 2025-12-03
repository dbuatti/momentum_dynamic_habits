import { Progress } from '@/components/ui/progress';
import { Flame } from 'lucide-react';

export const NextBadgeCard = () => (
  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
    <div className="bg-orange-100 rounded-full p-2">
      <Flame className="w-6 h-6 text-orange-500" />
    </div>
    <div className="flex-grow">
      <p className="text-sm text-muted-foreground">Next badge</p>
      <p className="font-semibold">Momentum Builder</p>
      <div className="flex items-center space-x-2 mt-1">
        <Progress value={66} className="h-1.5 [&>div]:bg-orange-400" />
        <p className="text-sm font-semibold text-orange-600">3 <span className="font-normal text-muted-foreground">days left</span></p>
      </div>
    </div>
  </div>
);