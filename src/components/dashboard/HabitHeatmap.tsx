import React from 'react';
import { format, subMonths, startOfDay, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HabitCompletion {
  date: string;
  count: number;
}

interface HabitHeatmapProps {
  completions: HabitCompletion[];
  habitName?: string;
}

interface HeatmapDay {
  date: Date;
  dateStr: string;
  count: number;
}

const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ completions, habitName }) => {
  // Generate last 90 days
  const today = new Date();
  const startDate = subMonths(today, 3);
  
  // Create a map for quick lookup
  const completionMap = new Map<string, number>();
  completions.forEach(completion => {
    completionMap.set(completion.date, completion.count);
  });
  
  // Generate all days in the range
  const days: HeatmapDay[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= today) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    days.push({
      date: new Date(currentDate),
      dateStr,
      count: completionMap.get(dateStr) || 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Group days by week
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  
  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  // Add remaining days to the last week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  // Get max count for color scaling
  const maxCount = Math.max(...completions.map(c => c.count), 1);
  
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count >= maxCount * 0.75) return 'bg-green-500';
    if (count >= maxCount * 0.5) return 'bg-green-400';
    if (count >= maxCount * 0.25) return 'bg-green-300';
    return 'bg-green-200';
  };
  
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          {habitName ? `${habitName} Consistency` : 'Habit Consistency'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-1">
          <div className="flex justify-end space-x-1 pb-1">
            <span className="text-xs text-muted-foreground w-6 text-center">M</span>
            <span className="text-xs text-muted-foreground w-6 text-center">W</span>
            <span className="text-xs text-muted-foreground w-6 text-center">F</span>
          </div>
          
          <div className="flex space-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => (
                  <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-6 h-6 rounded-sm border border-border",
                            getIntensityClass(day.count)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {day.count} {habitName ? 'completions' : 'habits'} on {format(day.date, 'MMM d, yyyy')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 border border-border rounded-sm"></div>
              <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitHeatmap;