import { Clock, Target, BarChart, Zap } from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface PatternsCardProps {
  patterns: {
    streak: number;
    totalSessions: number;
    consistency: number;
    bestTime: string;
  };
}

const PatternItem = ({ 
  icon, 
  title, 
  value,
  highlight = false
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string,
  highlight?: boolean
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const baseClasses = "rounded-xl p-4 transition-all hover:shadow-sm";
  const highlightClasses = highlight 
    ? "ring-1 ring-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5" 
    : "bg-[hsl(var(--muted))] dark:bg-[hsl(var(--muted))]/50";
  const textClasses = highlight ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--foreground))]";

  return (
    <div className={cn(baseClasses, highlightClasses)}>
      <div className="flex items-center space-x-2 text-[hsl(var(--muted-foreground))]">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <p className={cn("font-bold text-xl mt-2", textClasses)}>
        {value}
      </p>
    </div>
  );
};

export const PatternsCard: React.FC<PatternsCardProps> = ({ patterns }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold mb-1">Your Patterns</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <PatternItem 
            icon={<Clock className="w-4 h-4" />} 
            title="Best time" 
            value={patterns.bestTime} 
            highlight={patterns.bestTime !== '—'}
          />
          <PatternItem 
            icon={<Target className="w-4 h-4" />} 
            title="Consistency" 
            value={`${patterns.consistency}% of days`} 
          />
          <PatternItem 
            icon={<Zap className="w-4 h-4" />} 
            title="Best streak" 
            value={`${patterns.streak} days`} 
            highlight={patterns.streak > 0}
          />
          <PatternItem 
            icon={<BarChart className="w-4 h-4" />} 
            title="Total sessions" 
            value={`${patterns.totalSessions}`} 
          />
        </div>
      </CardContent>
    </Card>
  );
};