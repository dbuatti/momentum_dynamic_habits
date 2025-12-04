import { TrendingUp } from 'lucide-react';

export const DisciplineBanner = () => (
  <div className="bg-habit-purple border border-habit-purple-border text-habit-purple-foreground rounded-2xl p-3 flex items-center space-x-3">
    <TrendingUp className="w-5 h-5" />
    <p className="font-medium text-sm">Cultivate discipline, achieve growth.</p>
  </div>
);