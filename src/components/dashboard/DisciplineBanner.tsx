import { TrendingUp, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export const DisciplineBanner = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const cardBg = isDark ? "bg-[hsl(var(--habit-purple))]/20" : "bg-[hsl(var(--habit-purple))]";
  const cardBorder = isDark ? "border-[hsl(var(--habit-purple-border))]" : "border-[hsl(var(--habit-purple-border))]";
  const cardText = isDark ? "text-[hsl(var(--habit-purple-foreground))]" : "text-[hsl(var(--habit-purple-foreground))]";

  return (
    <Card className={cn("rounded-2xl shadow-sm border-0", cardBg, cardBorder, cardText)}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
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
};