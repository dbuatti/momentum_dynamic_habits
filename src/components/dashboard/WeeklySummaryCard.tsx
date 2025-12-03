import { TrendingUp } from 'lucide-react';

export const WeeklySummaryCard = () => (
  <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
    <h3 className="font-semibold">This Week</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Push-ups</p>
        <p className="text-2xl font-bold">60</p>
        <div className="flex items-center text-sm text-green-600 font-medium">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+500% vs last week</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Meditation</p>
        <p className="text-2xl font-bold">20m</p>
        <div className="flex items-center text-sm text-green-600 font-medium">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+150% vs last week</span>
        </div>
      </div>
    </div>
    <div>
      <div className="flex space-x-1 text-green-500">
        {[...Array(7)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-current"></div>)}
      </div>
      <p className="text-sm mt-1">7/7 days active</p>
      <p className="text-sm text-muted-foreground">Incredible consistency this week! 🔥</p>
    </div>
  </div>
);