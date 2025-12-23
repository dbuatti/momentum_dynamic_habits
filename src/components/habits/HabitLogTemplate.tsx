"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowLeft, CheckCircle2, Target, Anchor, Zap, ShieldCheck, Clock, Layers, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { HabitCapsule } from '@/components/dashboard/HabitCapsule';
import { useCapsules } from '@/hooks/useCapsules';
import { useHabitLog } from '@/hooks/useHabitLog';
import { calculateDynamicChunks } from '@/utils/progress-utils';
import { TrialStatusCard } from '@/components/dashboard/TrialStatusCard';
import { ProcessedUserHabit } from '@/types/habit';
import { HabitColor } from '@/lib/habit-utils';

interface HabitLogTemplateProps {
  habit: ProcessedUserHabit;
  habitIcon: React.ElementType;
  habitColor: HabitColor;
  neurodivergentMode: boolean;
  bestTime: string;
}

const HabitLogTemplate: React.FC<HabitLogTemplateProps> = ({
  habit,
  habitIcon: Icon,
  habitColor,
  neurodivergentMode,
  bestTime,
}) => {
  const { dbCapsules, completeCapsule, uncompleteCapsule } = useCapsules();
  const { mutate: logHabit, unlog } = useHabitLog();

  const {
    id,
    key: habit_key, // Use 'key' from ProcessedUserHabit
    name,
    unit,
    current_daily_goal, // Base daily goal
    adjustedDailyGoal,  // Daily goal including carryover
    dailyProgress,
    isComplete,
    is_trial_mode,
    is_fixed,
    frequency_per_week,
    weekly_completions,
    plateau_days_required,
    completions_in_plateau,
    growth_stats, // Use growth_stats directly
    auto_chunking,
    enable_chunks,
    num_chunks,
    chunk_duration,
  } = habit;

  const colorMap = {
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', iconBg: 'bg-orange-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconBg: 'bg-red-100' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
  };
  const colors = colorMap[habitColor];

  // Calculate chunks for display
  const { numChunks: calculatedNumChunks, chunkValue: calculatedChunkValue } = calculateDynamicChunks(
    habit_key,
    adjustedDailyGoal, // Pass adjustedDailyGoal to chunk calculation
    unit,
    neurodivergentMode,
    auto_chunking,
    num_chunks, // Pass manual num_chunks
    chunk_duration // Pass manual chunk_duration
  );

  const capsules = Array.from({ length: calculatedNumChunks }).map((_, i) => {
    const dbCapsule = dbCapsules?.find(c => c.habit_key === habit_key && c.capsule_index === i);
    const threshold = (i + 1) * calculatedChunkValue;
    const isCapsuleCompleted = dbCapsule?.is_completed || dailyProgress >= (i === calculatedNumChunks - 1 ? adjustedDailyGoal : threshold);

    return {
      id: `${habit_key}-${i}`,
      habitKey: habit_key,
      index: i,
      label: enable_chunks ? `Part ${i + 1}` : (is_trial_mode ? 'Trial Session' : 'Daily Goal'),
      value: calculatedChunkValue,
      initialValue: Math.max(0, Math.min(calculatedChunkValue, dailyProgress - (i * calculatedChunkValue))),
      unit: unit,
      isCompleted: isCapsuleCompleted,
      scheduledTime: dbCapsule?.scheduled_time,
    };
  });

  const handleCapsuleComplete = (capsule: any, actualValue: number, mood?: string) => {
    logHabit({ habitKey: habit_key, value: actualValue, taskName: `${name} session` });
    completeCapsule.mutate({ habitKey: habit_key, index: capsule.index, value: actualValue, mood });
  };

  const handleCapsuleUncomplete = (capsule: any) => {
    uncompleteCapsule.mutate({ habitKey: habit_key, index: capsule.index });
    unlog({ habitKey: habit_key, taskName: `${name} session` });
  };

  const progressPercentage = (dailyProgress / adjustedDailyGoal) * 100;
  const isGrowthMode = !is_fixed && !is_trial_mode;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title={`${name || habit_key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())} Analytics`} backLink="/" />

        {/* Habit Overview Card */}
        <Card className={cn("rounded-2xl shadow-lg border-4 overflow-hidden", colors.border, colors.bg)}>
          <CardHeader className="p-8 text-center">
            <div className={cn("rounded-full w-24 h-24 flex items-center justify-center mb-6 mx-auto", colors.iconBg)}>
              <Icon className={cn("w-12 h-12", colors.text)} />
            </div>
            <CardTitle className={cn("text-2xl font-bold", colors.text)}>
              {name || habit_key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {is_fixed ? 'Fixed Goal' : (is_trial_mode ? 'Trial Mode' : 'Adaptive Growth Mode')}
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-0 text-center space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-foreground">Daily Progress</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(dailyProgress)}/{Math.round(adjustedDailyGoal)} {unit}
                </p>
              </div>
              <Progress value={progressPercentage} className="h-3 [&>div]:bg-primary" />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Weekly Sessions</span>
                <span>{weekly_completions}/{frequency_per_week}</span>
              </div>
            </div>

            {is_trial_mode && (
              <TrialStatusCard
                habitName={name}
                sessionsPerWeek={frequency_per_week}
                duration={current_daily_goal}
                unit={unit}
                completionsInPlateau={completions_in_plateau}
                plateauDaysRequired={plateau_days_required}
                className="bg-white/50 border-blue-100"
              />
            )}

            {isGrowthMode && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">Stability Status</p>
                    <span className="text-[10px] font-black text-primary">{growth_stats.completions}/{growth_stats.required} days</span>
                  </div>
                  <Progress value={(growth_stats.completions / growth_stats.required) * 100} className="h-1 [&>div]:bg-primary" />
                  <p className="text-[11px] font-medium opacity-60 mt-2 leading-tight">
                    {growth_stats.daysRemaining} consistent days until dynamic goal increase ({growth_stats.phase === 'frequency' ? 'Frequency' : 'Duration'} phase).
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-lg font-semibold text-foreground">Today's Sessions</p>
              <div className="grid gap-3">
                {capsules.map((capsule: any) => (
                  <HabitCapsule
                    key={capsule.id}
                    {...capsule}
                    habitName={name}
                    color={habitColor}
                    onComplete={(actual, mood) => handleCapsuleComplete(habit, capsule, actual, mood)}
                    onUncomplete={() => handleCapsuleUncomplete(habit, capsule)}
                    showMood={neurodivergentMode}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Link to="/">
                <Button className={cn("text-white text-lg py-6 rounded-2xl", `bg-${habitColor}-500 hover:bg-${habitColor}-600`)}>
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Section */}
        <Card className="rounded-2xl shadow-sm border-0">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="font-semibold text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-muted-foreground" />
              Coming Soon: Performance Graphs & Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-muted-foreground space-y-3">
            <p>
              This section will soon display detailed historical data, trends, and personalized insights for your {name} habit.
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Interactive charts showing progress over time.</li>
              <li>Weekly and monthly performance summaries.</li>
              <li>Insights into your best completion times ({bestTime !== '—' ? bestTime : 'log more tasks to discover'}).</li>
              <li>Adaptive recommendations for optimal growth.</li>
            </ul>
            <p className="text-xs italic mt-3">
              "Consistency is more important than intensity."
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HabitLogTemplate;