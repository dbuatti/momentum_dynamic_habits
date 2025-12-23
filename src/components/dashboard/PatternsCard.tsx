import { Clock, Target, BarChart, Zap } from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
}) => (
  <div className={cn(
    "bg-secondary dark:bg-secondary/50 rounded-xl p-4 transition-all hover:shadow-sm",
    highlight && "ring-1 ring-primary/20 bg-primary/5"
  )}>
    <div className="flex items-center space-x-2 text-muted-foreground">
      {icon}
      <span className="text-sm">{title}</span>
    </div>
    <p className={cn(
      "font-bold text-xl mt-2",
      highlight && "text-primary"
    )}>
      {value}
    </p>
  </div>
);

export const PatternsCard: React.FC<PatternsCardProps> = ({ patterns }) => (
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