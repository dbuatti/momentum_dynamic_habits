"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, Target, Play, Lock, Info, Loader2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedUserHabit } from '@/types/habit';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { Link } from 'react-router-dom';

interface WeeklyObjectiveCardProps {
  habit: ProcessedUserHabit;
  isLocked: boolean;
  dependentHabitName: string;
  onFocus: (habitKey: string) => void;
}

export const WeeklyObjectiveCard: React.FC<WeeklyObjectiveCardProps> = ({ 
  habit, 
  isLocked, 
  dependentHabitName,
  onFocus
}) => {
  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
  const colorKey = habitColorMap[habit.habit_key] || 'blue';

  const sessionMinDuration = habit.weekly_session_min_duration || habit.current_daily_goal || 10; // In minutes
  const isCompleteForWeek = habit.weekly_progress >= habit.frequency_per_week;
  const progressPercentage = Math.min(100, (habit.weekly_progress / habit.frequency_per_week) * 100);
  
  const sessionsRemaining = Math.max(0, habit.frequency_per_week - habit.weekly_progress);

  const colors = {
    indigo: { bg: 'bg-habit-indigo/10', border: 'border-habit-indigo-border/50', text: 'text-habit-indigo-foreground', progress: 'bg-habit-indigo-foreground' },
    orange: { bg: 'bg-habit-orange/10', border: 'border-habit-orange-border/50', text: 'text-habit-orange-foreground', progress: 'bg-habit-orange-foreground' },
    blue: { bg: 'bg-habit-blue/10', border: 'border-habit-blue-border/50', text: 'text-habit-blue-foreground', progress: 'bg-habit-blue-foreground' },
    green: { bg: 'bg-habit-green/10', border: 'border-habit-green-border/50', text: 'text-habit-green-foreground', progress: 'bg-habit-green-foreground' },
    purple: { bg: 'bg-habit-purple/10', border: 'border-habit-purple-border/50', text: 'text-habit-purple-foreground', progress: 'bg-habit-purple-foreground' },
    red: { bg: 'bg-habit-red/10', border: 'border-habit-red-border/50', text: 'text-habit-red-foreground', progress: 'bg-habit-red-foreground' },
  }[colorKey];

  return (
    <Card 
      id={`habit-card-${habit.habit_key}`}
      className={cn(
        "rounded-3xl shadow-lg border-2 transition-all duration-300",
        colors.bg, colors.border,
        isLocked && "opacity-50 grayscale-[0.5]",
        isCompleteForWeek && "bg-success/10 border-success/30"
      )}
    >
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
                  <CalendarCheck className="w-3 h-3 inline-block mr-1" />
                  Weekly Objective
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
        ) : isCompleteForWeek ? (
          <div className="p-4 bg-success/20 rounded-xl border border-success/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <p className="text-sm font-semibold text-success-foreground">Weekly goal met! You are consistent.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 rounded-xl bg-card/50 border border-border/50">
                    <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" /> Session Minimum
                    </p>
                    <p className="text-lg font-black text-foreground">
                        {sessionMinDuration} {habit.unit}
                    </p>
                </div>
                <div className="space-y-1 p-3 rounded-xl bg-card/50 border border-border/50">
                    <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Sessions Remaining
                    </p>
                    <p className="text-lg font-black text-foreground">
                        {sessionsRemaining}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground">Weekly Progress</span>
                <span className="text-foreground tabular-nums">
                  {habit.weekly_progress} / {habit.frequency_per_week} sessions
                </span>
              </div>
              <Progress value={progressPercentage} className={cn("h-2", `[&>div]:${colors.progress}`)} />
            </div>

            <Button
              size="lg"
              className="w-full h-12 px-8 rounded-2xl font-black text-base shadow-md"
              onClick={() => onFocus(habit.habit_key)}
              disabled={isLocked}
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> Start Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};