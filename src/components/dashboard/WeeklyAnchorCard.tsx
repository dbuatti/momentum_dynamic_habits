"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Anchor, Calendar, CheckCircle2, Target, Play, Lock, Info, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedUserHabit } from '@/types/habit';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { useHabitLog } from '@/hooks/useHabitLog';
import { showError } from '@/utils/toast';

interface WeeklyAnchorCardProps {
  habit: ProcessedUserHabit;
  isLocked: boolean;
  dependentHabitName: string;
}

export const WeeklyAnchorCard: React.FC<WeeklyAnchorCardProps> = ({ 
  habit, 
  isLocked, 
  dependentHabitName 
}) => {
  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
  const colorKey = habitColorMap[habit.habit_key] || 'indigo';
  const { mutate: logHabit, isPending } = useHabitLog();

  const isCompleteForWeek = habit.weekly_progress >= habit.frequency_per_week;
  const progressPercentage = Math.min(100, (habit.weekly_progress / habit.frequency_per_week) * 100);
  
  const sessionsRemaining = Math.max(0, habit.frequency_per_week - habit.weekly_progress);

  const handleLogSession = () => {
    if (isLocked) {
      showError(`Please complete ${dependentHabitName} first.`);
      return;
    }
    
    // Log the full daily goal value (which is the session value)
    logHabit({
      habitKey: habit.habit_key,
      value: habit.current_daily_goal,
      taskName: `${habit.name} session`,
    });
  };

  const colors = {
    indigo: { bg: 'bg-habit-indigo/10', border: 'border-habit-indigo-border/50', text: 'text-habit-indigo-foreground', progress: 'bg-habit-indigo-foreground' },
    // Fallback colors (should match habitColorMap in habit-utils)
    orange: { bg: 'bg-habit-orange/10', border: 'border-habit-orange-border/50', text: 'text-habit-orange-foreground', progress: 'bg-habit-orange-foreground' },
    blue: { bg: 'bg-habit-blue/10', border: 'border-habit-blue-border/50', text: 'text-habit-blue-foreground', progress: 'bg-habit-blue-foreground' },
    green: { bg: 'bg-habit-green/10', border: 'border-habit-green-border/50', text: 'text-habit-green-foreground', progress: 'bg-habit-green-foreground' },
    purple: { bg: 'bg-habit-purple/10', border: 'border-habit-purple-border/50', text: 'text-habit-purple-foreground', progress: 'bg-habit-purple-foreground' },
    red: { bg: 'bg-habit-red/10', border: 'border-habit-red-border/50', text: 'text-habit-red-foreground', progress: 'bg-habit-red-foreground' },
  }[colorKey];

  return (
    <Card className={cn(
      "rounded-3xl shadow-lg border-2 transition-all duration-300",
      colors.bg, colors.border,
      isLocked && "opacity-50 grayscale-[0.5]",
      isCompleteForWeek && "bg-success/10 border-success/30"
    )}>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
              isCompleteForWeek ? "bg-success/20 text-success border-success/30" : "bg-card/90 border-border"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight">{habit.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                  colors.text, colors.border, colors.bg
                )}>
                  <Anchor className="w-3 h-3 inline-block mr-1" />
                  Weekly Anchor
                </span>
              </div>
            </div>
          </div>
          
          {isCompleteForWeek && (
            <div className="flex flex-col items-end text-success">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xs font-bold mt-1">Complete</span>
            </div>
          )}
        </div>

        {isLocked ? (
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Locked. Complete {dependentHabitName} first.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground">Sessions Logged This Week</span>
                <span className="text-foreground tabular-nums">
                  {habit.weekly_progress} / {habit.frequency_per_week}
                </span>
              </div>
              <Progress value={progressPercentage} className={cn("h-2", `[&>div]:${colors.progress}`)} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>Session Goal: {habit.current_daily_goal} {habit.unit}</span>
              </div>
              <Button
                size="lg"
                className={cn(
                  "h-12 px-8 rounded-2xl font-black text-base shadow-md",
                  isCompleteForWeek ? "bg-success text-success-foreground hover:bg-success/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleLogSession}
                disabled={isPending || isCompleteForWeek}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCompleteForWeek ? (
                  <>
                    <Check className="w-5 h-5 mr-2" /> Goal Met
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" /> Log Session
                  </>
                )}
              </Button>
            </div>
            
            {habit.is_trial_mode && (
              <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[10px] font-bold leading-tight text-muted-foreground">
                  Trial Mode: Focus on consistency. {habit.plateau_days_required - habit.completions_in_plateau} days left in plateau.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};