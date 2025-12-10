import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const DisciplineBanner = () => (
  <Card className="bg-habit-purple border border-habit-purple-border text-habit-purple-foreground rounded-2xl shadow-sm border-0">
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        <TrendingUp className="w-5 h-5" />
        <p className="font-medium text-sm">Cultivate discipline, achieve growth.</p>
      </div>
    </CardContent>
  </Card>
);