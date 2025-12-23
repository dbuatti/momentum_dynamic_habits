import { TrendingUp, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const DisciplineBanner = () => (
  <Card className="bg-habit-purple border border-habit-purple-border text-habit-purple-foreground rounded-2xl shadow-sm border-0">
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        <div className="bg-card rounded-full p-2">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-sm">Cultivate discipline, achieve growth.</p>
          <p className="text-xs opacity-80 mt-0.5">Small consistent actions lead to big results</p>
        </div>
      </div>
    </CardContent>
  </Card>
);