"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Lock, CheckCircle2, Layers, CalendarCheck, CalendarDays, Sparkles, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedUserHabit } from '@/types/habit';
import { useCapsules } from '@/hooks/useCapsules';
import { showError, showSuccess } from '@/utils/toast';
import { Progress } from '@/components/ui/progress';
import { MacroGoalProgress } from '@/components/dashboard/MacroGoalProgress';
import { TrialGuidance } from '@/components/dashboard/TrialGuidance';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { HabitCapsule } from './HabitCapsule';
import confetti from 'canvas-confetti';

interface HabitAccordionItemProps {
  habit: ProcessedUserHabit;
  neurodivergentMode: boolean;
  expandedItems: string[];
  handleExpandedChange: (newValues: string[]) => void;
  logCapsuleProgress: ReturnType<typeof useCapsules>['logCapsuleProgress'];
  uncompleteCapsule: ReturnType<typeof useCapsules>['uncompleteCapsule'];
  showAllMomentum: Record<string, boolean>;
  toggleShowAll: (habitKey: string) => void;
  handleLogRemaining: (habit: ProcessedUserHabit) => Promise<void>;
  dependentHabitName: string;
  onSkip?: (habitKey: string) => void;
}

export const HabitAccordionItem: React.FC<HabitAccordionItemProps> = ({
  habit,
  neurodivergentMode,
  expandedItems,
  handleExpandedChange,
  logCapsuleProgress,
  uncompleteCapsule,
  showAllMomentum,
  toggleShowAll,
  handleLogRemaining,
  dependentHabitName,
  onSkip,
}) => {
  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
  const color = habitColorMap[habit.habit_key] || 'blue';
  const isTrial = habit.is_trial_mode;
  
  const accentColorClasses = {
      orange: 'bg-habit-orange border-habit-orange-border text-habit-orange-foreground',
      blue: 'bg-habit-blue border-habit-blue-border text-habit-blue-foreground',
      green: 'bg-habit-green border-habit-green-border text-habit-green-foreground',
      purple: 'bg-habit-purple border-habit-purple-border text-habit-purple-foreground',
      red: 'bg-habit-red border-habit-red-border text-habit-red-foreground',
      indigo: 'bg-habit-indigo border-habit-indigo-border text-habit-indigo-foreground',
  }[color];

  const nextCapsule = habit.capsules.find((c: any) => !c.isCompleted);
  const showOnlyNext = !showAllMomentum[habit.key] && habit.numChunks > 1;
  const isLocked = habit.isLockedByDependency;
  
  const canQuickFinish = !habit.allCompleted && !isLocked;

  const handleQuickCheck = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion from toggling
    if (isLocked || habit.allCompleted) return;

    if (nextCapsule) {
      await logCapsuleProgress.mutateAsync({ 
        habitKey: habit.key, 
        index: nextCapsule.index, 
        value: nextCapsule.value, 
        taskName: `${habit.name} session`, 
        isComplete: true,
      });
      
      if (habit.capsules.filter(c => !c.isCompleted).length === 1) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#22c55e']
        });
      }
    }
  };

  const handleSkipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSkip) {
      onSkip(habit.key);
      showSuccess(`${habit.name} hidden for today.`);
    }
  };

  const handleCapsuleProgress = async (capsule: any, actualValue: number, isComplete: boolean, mood?: string) => {
    await logCapsuleProgress.mutateAsync({ 
      habitKey: habit.key, index: capsule.index, value: actualValue, mood, 
      taskName: `${habit.name} session`, isComplete: isComplete,
    });
  };

  const handleCapsuleUncomplete = (capsule: any) => {
    if (capsule.completedTaskId) {
      uncompleteCapsule.mutate({ habitKey: habit.key, index: capsule.index, completedTaskId: capsule.completedTaskId });
    } else {
      showError("No specific log found for this part. You can still undo recent activity from the History page.");
    }
  };

  return (
    <AccordionItem
      key={habit.key}
      value={habit.key}
      id={`habit-card-${habit.key}`}
      className={cn(
        "border-2 rounded-3xl mb-4 overflow-hidden transition-all duration-500",
        habit.allCompleted ? "opacity-75 border-success/30 bg-success/5 shadow-none" : cn(accentColorClasses, "shadow-md"),
        !habit.isWithinWindow && !habit.allCompleted && "opacity-75",
        isLocked && "opacity-40 grayscale-[0.5]"
      )}
    >
      <AccordionTrigger className="px-6 py-5 hover:no-underline group">
        <div className="flex items-center gap-5 text-left w-full">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border transition-transform group-hover:scale-105",
            habit.allCompleted ? "bg-success/20 text-success" : "bg-card/90"
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-grow pr-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black text-lg flex items-center gap-2 leading-tight truncate">
                {habit.name}
                {habit.allCompleted && <CheckCircle2 className="w-5 h-5 text-success inline-block ml-2" />}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                habit.allCompleted ? "bg-success text-success-foreground border-transparent" : habit.isWithinWindow ? "bg-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground border-transparent"
              )}>
                {habit.allCompleted ? "Goal Reached" : (habit.isWithinWindow ? "Ready Now" : "Restricted")}
              </span>
              {habit.is_weekly_goal && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20 border flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3" /> Weekly Goal
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!habit.allCompleted && !isLocked && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                  onClick={handleSkipClick}
                  title="Skip for Today"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
                  onClick={handleQuickCheck}
                  title="Quick Log"
                >
                  <Check className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
        {isLocked && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 ml-[72px]">
            <Lock className="w-3.5 h-3.5" />
            <span>Locked. Complete {dependentHabitName} first.</span>
          </div>
        )}
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
        {(habit.is_trial_mode || habit.anchor_practice) && !habit.allCompleted && (
          <TrialGuidance
            habitKey={habit.key}
            habitName={habit.name}
            isTrial={habit.is_trial_mode}
            isAnchor={habit.anchor_practice}
            completionsInPlateau={habit.completions_in_plateau}
            plateauDaysRequired={habit.plateau_days_required}
            dailyGoal={habit.dailyGoal}
            unit={habit.unit}
            frequency={habit.frequency_per_week}
          />
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground">{isTrial ? "Session Target" : "Daily Goal"}</p>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-foreground">
                      {Math.round(habit.dailyGoal)} {habit.unit}
                      {habit.carryoverValue > 0 && <span className="ml-1 text-[10px] font-bold text-success"> (+{Math.round(habit.carryoverValue)})</span>}
                    </p>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground">Weekly Goal</p>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-foreground">{Math.round(habit.weekly_goal)} {habit.unit}</p>
                </div>
            </div>
        </div>
        
        <div className="w-full">
          <MacroGoalProgress current={habit.weekly_completions} total={habit.frequency_per_week} label={isTrial ? "Weekly Session Log" : "Weekly Consistency"} />
        </div>
        
        <div className="w-full mt-4 mb-6">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Daily Progress</p>
          <Progress value={Math.min(100, (habit.displayProgress / habit.adjustedDailyGoal) * 100)} className="h-1.5 [&>div]:bg-primary" />
        </div>
        
        {canQuickFinish && (
          <Button 
            size="lg" variant="secondary" className="w-full h-12 px-3 rounded-2xl text-sm font-black uppercase tracking-wider shadow-sm hover:scale-[1.005] transition-transform mb-4"
            onClick={() => handleLogRemaining(habit)}
          >
            <Check className="w-4 h-4 mr-2" /> Quick Finish Remaining ({Math.round(Math.max(0, habit.adjustedDailyGoal - habit.displayProgress))} {habit.unit})
          </Button>
        )}

        {!habit.allCompleted && (
          <div className="grid gap-3">
            {showOnlyNext && nextCapsule ? (
              <>
                <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-muted/40 z-0" />
                    <HabitCapsule key={nextCapsule.id} {...nextCapsule} habitName={habit.name} color={color} onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress(nextCapsule, actual, isComplete, mood)} onUncomplete={() => handleCapsuleUncomplete(nextCapsule)} showMood={neurodivergentMode} />
                </div>
                <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-dashed text-muted-foreground" onClick={() => toggleShowAll(habit.key)}>
                  <Layers className="w-3.5 h-3.5 mr-2" /> View all session parts ({habit.numChunks})
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                {habit.capsules.map((capsule: any) => (
                  <HabitCapsule key={capsule.id} {...capsule} habitName={habit.name} color={color} onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress(capsule, actual, isComplete, mood)} onUncomplete={() => handleCapsuleUncomplete(capsule)} showMood={neurodivergentMode} />
                ))}
                {habit.numChunks > 1 && (
                  <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase opacity-40 h-8" onClick={() => toggleShowAll(habit.key)}>Simplify View (Focus Next)</Button>
                )}
              </div>
            )}
          </div>
        )}
        
        {habit.allCompleted && !habit.is_fixed && (
          <div className="p-5 bg-success/10 rounded-[28px] border-2 border-dashed border-success/30 flex flex-col items-center gap-4 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center text-success"><Sparkles className="w-8 h-8" /></div>
            <div className="space-y-1">
              <h4 className="font-black text-lg text-success">Goal Crushed!</h4>
              <p className="text-sm font-medium text-success-foreground opacity-80">You've hit your target for today.</p>
            </div>
            <div className="w-full">
              <HabitCapsule id={`${habit.key}-bonus`} habitKey={habit.key} habitName={habit.name} label="Bonus Session" value={habit.capsules[0]?.value || 10} unit={habit.unit} measurementType={habit.measurement_type} isCompleted={false} isHabitComplete={true} isFixed={false} color={color} onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress({ index: 99 }, actual, isComplete, mood)} onUncomplete={() => {}} showMood={neurodivergentMode} />
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};