"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell, Wind, BookOpen, Music, AlertCircle, Loader2, Zap, Home, Code, ClipboardList } from 'lucide-react'; // Added ClipboardList
import { useCompletedTasks } from '@/hooks/useCompletedTasks';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

const habitIconMap: { [key: string]: React.ElementType } = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home, // New
  projectwork: Code, // New
};

const History = () => {
  const { data: completedTasks, isLoading, isError } = useCompletedTasks();

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-8 animate-pulse">
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

  // Group tasks by date
  const groupedTasks = completedTasks?.reduce((acc, task) => {
    const date = format(parseISO(task.completed_at), 'PPP'); // e.g., "Oct 27, 2023"
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof completedTasks>);

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <PageHeader title="Activity History" backLink="/" />

      {completedTasks && completedTasks.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-sm text-center space-y-4">
          <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto" />
          <p className="text-xl font-semibold text-foreground">
            No completed tasks yet!
          </p>
          <p className="text-muted-foreground">
            Start logging your habits on the dashboard to see your progress here.
          </p>
          <Link to="/"><Button className="mt-4">Go to Dashboard</Button></Link>
        </div>
      ) : (
        Object.entries(groupedTasks || {}).map(([date, tasks]) => (
          <Card key={date} className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{date}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task, index) => {
                const Icon = habitIconMap[task.original_source];
                // Determine if the task is time-based (duration_used is not null)
                const isTimeBased = task.duration_used !== null && task.original_source !== 'pushups';
                
                return (
                  <React.Fragment key={task.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
                        <div>
                          <p className="font-medium">{task.task_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(task.completed_at), 'hh:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isTimeBased ? (
                          <p className="font-semibold">{task.duration_used! / 60} min</p>
                        ) : (
                          <p className="font-semibold">{task.xp_earned} reps</p> // Assuming XP earned is equivalent to reps for pushups
                        )}
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Zap className="w-3 h-3 mr-1 text-yellow-500" />
                          <span>{task.xp_earned} XP</span>
                        </div>
                      </div>
                    </div>
                    {index < tasks.length - 1 && <Separator className="my-4" />}
                  </React.Fragment>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default History;