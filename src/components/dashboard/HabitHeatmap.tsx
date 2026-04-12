import React from 'react';
import { format, subMonths, startOfDay, isSameDay, subWeeks } from 'date-fns'; // Add subWeeks
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from 'lucide-react';

interface HabitCompletion {
  date: string;
  count: number;
}

interface HabitHeatmapProps {
  completions: HabitCompletion[];
  habitName?: string;
  timeframe?: string; // Add timeframe prop
}

interface HeatmapDay {
  date: Date;
  dateStr: string;
  count: number;
}

const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ completions, habitName, timeframe = '8_weeks' }) => { // Default timeframe
  const today = new Date();
  let startDate: Date;

  switch (timeframe) {
    case '4_weeks':
      startDate = subWeeks(today, 4);
      break;
    case '12_weeks':
      startDate = subWeeks(today, 12);
      break;
    case '8_weeks': // Default
    default:
      startDate = subWeeks(today, 8); // Changed from subMonths(today, 3) to match analytics data fetch
      break;
  }
  
  // Ensure startDate is at the beginning of the day
  startDate = startOfDay(startDate);

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
  
  // Fill the first week with leading empty days if startDate is not a Sunday (0)
  const firstDayOfWeek = startDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: new Date(0), dateStr: '', count: 0 }); // Placeholder for empty days
  }

  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  // Add remaining days to the last week
  if (currentWeek.length > 0) {
    // Pad the last week with empty days if it's not full
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(0), dateStr: '', count: 0 });
    }
    weeks.push(currentWeek);
  }

  // Get max count for color scaling
  const maxCount = Math.max(...completions.map(c => c.count), 1);
  
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-secondary dark:bg-muted';
    if (count >= maxCount * 0.75) return 'bg-success';
    if (count >= maxCount * 0.5) return 'bg-success/80';
    if (count >= maxCount * 0.25) return 'bg-success/60';
    return 'bg-success/40';
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
          {habitName ? `${habitName} Consistency` : 'Habit Consistency'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-1">
          <div className="flex justify-end space-x-1 pb-1">
            <span className="text-xs text-muted-foreground w-6 text-center">M</span>
            <span className="text-xs text-muted-foreground w-6 text-center">W</span>
            <span className="text-xs text-muted-foreground w-6 text-center">F</span>
          </div>
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => (
                  <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "w-6 h-6 rounded-sm border border-border",
                            day.dateStr === '' ? 'bg-transparent border-transparent' : getIntensityClass(day.count) // Handle empty days
                          )} 
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {day.dateStr === '' ? (
                          <p>No data</p>
                        ) : (
                          <p>
                            {day.count} {habitName ? 'completions' : 'habits'} on {format(day.date, 'MMM d, yyyy')}
                          </p>
                        )}
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
              <div className="w-3 h-3 bg-secondary dark:bg-muted border border-border rounded-sm"></div>
              <div className="w-3 h-3 bg-success/40 rounded-sm"></div>
              <div className="w-3 h-3 bg-success/60 rounded-sm"></div>
              <div className="w-3 h-3 bg-success/80 rounded-sm"></div>
              <div className="w-3 h-3 bg-success rounded-sm"></div>
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitHeatmap;