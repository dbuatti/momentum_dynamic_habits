import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell, Wind, BookOpen, Music, AlertCircle, Loader2, Zap, Home, Code, ClipboardList, Calendar, Filter, Sparkles, Pill, MessageSquare, Target } from 'lucide-react';
import { useCompletedTasks } from '@/hooks/useCompletedTasks';
import { format, parseISO, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import HabitHeatmap from '@/components/dashboard/HabitHeatmap';
import { useHabitHeatmapData } from '@/hooks/useHabitHeatmapData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardData } from '@/hooks/useDashboardData'; // Import useDashboardData
import { habitIconMap } from '@/lib/habit-utils'; // Import from centralized utility

const History = () => {
  const { data: completedTasks, isLoading, isError } = useCompletedTasks();
  const { data: heatmapData, isLoading: isHeatmapLoading } = useHabitHeatmapData();
  const { data: dashboardData, isLoading: isDashboardDataLoading } = useDashboardData(); // Fetch dashboard data
  const [filter, setFilter] = useState<string>('all');

  // Get unique habit types for filter
  const habitTypes = [...new Set(completedTasks?.map(task => task.original_source) || [])];

  // Filter tasks based on selected filter
  const filteredTasks = filter === 'all' ? completedTasks : completedTasks?.filter(task => task.original_source === filter);

  // Group tasks by date
  const groupedTasks = filteredTasks?.reduce((acc, task) => {
    const date = format(parseISO(task.completed_at), 'PPP'); // e.g., "Oct 27, 2023"
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof completedTasks>);

  if (isLoading || isHeatmapLoading || isDashboardDataLoading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-8 px-4 py-6 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <div className="w-10"></div>
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-8 text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading History</h2>
        <p className="text-muted-foreground">Failed to fetch your activity history. Please try again.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">
      <PageHeader title="Activity History" backLink="/" />
      
      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              {habitTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {dashboardData?.habits.find(h => h.key === type)?.name || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredTasks?.length || 0} activities
        </div>
      </div>

      {/* Habit Consistency Heatmap */}
      <div className="mb-6">
        <HabitHeatmap completions={heatmapData || []} habitName="All Habits" />
      </div>

      {filteredTasks && filteredTasks.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-sm text-center space-y-4">
          <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto" />
          <p className="text-xl font-semibold text-foreground">No completed tasks yet!</p>
          <p className="text-muted-foreground">Start logging your habits on the dashboard to see your progress here.</p>
          <Link to="/"><Button className="mt-4">Go to Dashboard</Button></Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks || {}).map(([date, tasks]) => (
            <Card key={date} className="rounded-2xl shadow-sm border-0">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-muted-foreground" />
                  {date}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="space-y-4">
                  {tasks.map((task, index) => {
                    const Icon = habitIconMap[task.original_source] || habitIconMap.custom_habit; // Fallback icon
                    const userHabit = dashboardData?.habits.find(h => h.key === task.original_source);
                    const unit = userHabit?.unit || 'reps'; // Default to reps if not found
                    
                    return (
                      <React.Fragment key={task.id}>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            {Icon && (
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                <Icon className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{task.task_name}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {format(parseISO(task.completed_at), 'hh:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {unit === 'min' ? (
                              <p className="font-semibold">{Math.round((task.duration_used || 0) / 60)} min</p>
                            ) : (
                              <p className="font-semibold">{Math.round((task.xp_earned || 0) / (userHabit?.xpPerUnit || 1))} {unit}</p>
                            )}
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Zap className="w-3 h-3 mr-1 text-warning" />
                              <span>{task.xp_earned} XP</span>
                            </div>
                          </div>
                        </div>
                        
                        {task.note && (
                          <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm italic text-muted-foreground">{task.note}</p>
                          </div>
                        )}
                        
                        {index < tasks.length - 1 && <Separator />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;