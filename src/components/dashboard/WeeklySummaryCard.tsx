import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklySummaryCardProps {
  summary: {
    pushups: { current: number; previous: number };
    meditation: { current: number; previous: number };
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

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
      <h3 className="font-semibold">This Week</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Push-ups</p>
          <p className="text-2xl font-bold">{summary.pushups.current}</p>
          <div className="flex items-center text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{pushupChange}% vs last week</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Meditation</p>
          <p className="text-2xl font-bold">{Math.round(summary.meditation.current)}m</p>
          <div className="flex items-center text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{meditationChange}% vs last week</span>
          </div>
        </div>
      </div>
      <div>
        <div className="flex space-x-1 text-green-500">
          {[...Array(7)].map((_, i) => <div key={i} className={cn("w-2 h-2 rounded-full", i < summary.activeDays ? "bg-current" : "bg-gray-200")}></div>)}
        </div>
        <p className="text-sm mt-1">{summary.activeDays}/7 days active</p>
        <p className="text-sm text-muted-foreground">Incredible consistency this week! 🔥</p>
      </div>
    </div>
  );
};