"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { 
  BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, 
  CheckCircle2, Timer, Target, Anchor, Clock, Zap, ChevronDown, ChevronUp,
  Layers, TrendingUp, ShieldCheck, Info, PlusCircle, Lock
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { HabitCapsule } from "@/components/dashboard/HabitCapsule";
import { useCapsules } from "@/hooks/useCapsules";
import { useHabitLog } from "@/hooks/useHabitLog";
import React, { useState, useMemo, useEffect } from "react";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TipCard } from "@/components/dashboard/TipCard";
import { calculateDynamicChunks } from "@/utils/progress-utils";
import { MacroGoalProgress } from "@/components/dashboard/MacroGoalProgress";
import { Progress } from "@/components/ui/progress";
import { TrialStatusCard } from "@/components/dashboard/TrialStatusCard";
import { GrowthGuide } from "@/components/dashboard/GrowthGuide";
import { Link } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { useSession } from "@/contexts/SessionContext";
import { useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const { data, isLoading, isError } = useDashboardData();
  const { dbCapsules, isLoading: isCapsulesLoading, logCapsuleProgress, uncompleteCapsule } = useCapsules();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const { mutate: logHabit, unlog } = useHabitLog();
  const { session } = useSession();
  const queryClient = useQueryClient();
  
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hasInitializedState, setHasInitializedState] = useState(false);
  const [showAllMomentum, setShowAllMomentum] = useState<Record<string, boolean>>({});

  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];

    return data.habits
      .filter(habit => habit.is_visible)
      .map(habit => {
      const goal = habit.adjustedDailyGoal;
      const progress = habit.dailyProgress;
      const capsuleMapping = (habit as any).capsuleTaskMapping || {};
      
      const { numChunks, chunkValue } = calculateDynamicChunks(
        habit.key,
        goal,
        habit.unit,
        data.neurodivergentMode,
        habit.auto_chunking,
        habit.enable_chunks, 
        habit.num_chunks,
        habit.chunk_duration,
        habit.measurement_type
      );

      const isOverallComplete = habit.isComplete;

      const capsules = Array.from({ length: numChunks }).map((_, i) => {
        const isCompleted = progress >= ((i + 1) * chunkValue - 0.01);
        const taskId = capsuleMapping[i] || null;

        return {
          id: `${habit.key}-${i}`,
          habitKey: habit.key,
          index: i,
          label: habit.auto_chunking ? `Part ${i + 1}` : (habit.enable_chunks ? `Part ${i + 1}` : (habit.is_trial_mode ? 'Trial Session' : 'Daily Goal')),
          value: chunkValue,
          unit: habit.unit,
          measurementType: habit.measurement_type,
          isCompleted,
          isHabitComplete: isOverallComplete,
          isFixed: habit.is_fixed,
          completedTaskId: taskId, 
        };
      });

      const showExtraCapsule = isOverallComplete && !habit.is_fixed;

      return {
        ...habit,
        displayProgress: progress,
        capsules,
        allCompleted: isOverallComplete,
        numChunks,
        showExtraCapsule
      };
    }).sort((a, b) => {
      if (a.isLockedByDependency !== b.isLockedByDependency) {
        return a.isLockedByDependency ? 1 : -1;
      }
      if (a.allCompleted !== b.allCompleted) {
        return a.allCompleted ? 1 : -1;
      }
      if (a.category === 'anchor' && b.category !== 'anchor') return -1;
      if (a.category !== 'anchor' && b.category === 'anchor') return 1;
      const aProgressRatio = a.adjustedDailyGoal > 0 ? a.displayProgress / a.adjustedDailyGoal : 0;
      const bProgressRatio = b.adjustedDailyGoal > 0 ? b.displayProgress / b.adjustedDailyGoal : 0;
      if (aProgressRatio !== bProgressRatio) {
        return aProgressRatio - bProgressRatio;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [data?.habits, dbCapsules, data?.neurodivergentMode]);

  const anchorHabits = useMemo(() => habitGroups.filter(h => h.category === 'anchor' && h.is_visible), [habitGroups]);
  const dailyHabits = useMemo(() => habitGroups.filter(h => h.category !== 'anchor' && h.is_visible), [habitGroups]);

  useEffect(() => {
    if (habitGroups.length === 0 || hasInitializedState) return;

    const initialExpanded = habitGroups.filter(h => {
      const stored = localStorage.getItem(`habitAccordionState:${h.key}`);
      if (stored === 'expanded') return true;
      if (stored === 'collapsed') return false;
      return !h.allCompleted && !h.isLockedByDependency && (h.category === 'anchor' || h.is_trial_mode);
    }).map(h => h.key);

    setExpandedItems(initialExpanded);
    setHasInitializedState(true);
  }, [habitGroups, hasInitializedState]);

  const handleExpandedChange = (newValues: string[]) => {
    setExpandedItems(newValues);
    habitGroups.forEach(h => {
      const isNowExpanded = newValues.includes(h.key);
      localStorage.setItem(`habitAccordionState:${h.key}`, isNowExpanded ? 'expanded' : 'collapsed');
    });
  };

  const handleCapsuleProgress = async (habit: any, capsule: any, actualValue: number, isComplete: boolean, mood?: string) => {
    await logCapsuleProgress.mutateAsync({ 
      habitKey: habit.key, 
      index: capsule.index, 
      value: actualValue, 
      mood, 
      taskName: `${habit.name} session`,
      isComplete: isComplete,
    });
  };

  const handleCapsuleUncomplete = (habit: any, capsule: any) => {
    if (capsule.completedTaskId) {
      uncompleteCapsule.mutate({ 
        habitKey: habit.key, 
        index: capsule.index, 
        completedTaskId: capsule.completedTaskId 
      });
    } else {
      showError("No specific log found for this part. You can still undo recent activity from the History page.");
    }
  };

  const toggleShowAll = (habitKey: string) => {
    setShowAllMomentum(prev => ({ ...prev, [habitKey]: !prev[habitKey] }));
  };

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  const renderHabitItem = (habit: any) => {
    const Icon = habitIconMap[habit.key] || habitIconMap.custom_habit;
    const color = habitColorMap[habit.key] || 'blue';
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
    const dependentHabitName = data.habits.find(h => h.id === habit.dependent_on_habit_id)?.name || 'previous habit';

    return (
      <AccordionItem
        key={habit.key}
        value={habit.key}
        className={cn(
          "border-2 rounded-3xl mb-4 overflow-hidden transition-all duration-500",
          habit.allCompleted ? "opacity-75 border-success/30 bg-success/5" : cn(accentColorClasses, "shadow-md"),
          !habit.isWithinWindow && !habit.allCompleted && "opacity-75",
          isLocked && "opacity-40 grayscale-[0.5]"
        )}
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline group">
          <div className="flex flex-col w-full text-left gap-2">
            <div className="flex items-center gap-5 text-left w-full">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border",
                habit.allCompleted ? "bg-success/20 text-success" : "bg-card/90"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-grow pr-2">
                <h3 className="font-black text-lg flex items-center gap-2 leading-tight truncate">
                  {habit.name}
                  {habit.allCompleted && <CheckCircle2 className="w-5 h-5 text-success" />}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                    habit.allCompleted 
                      ? "bg-success text-success-foreground border-transparent"
                      : habit.isWithinWindow 
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "bg-muted text-muted-foreground border-transparent"
                  )}>
                    {habit.allCompleted ? "Goal Reached" : (habit.isWithinWindow ? "Ready Now" : "Restricted")}
                  </span>
                </div>
                <p className={cn("text-sm font-bold mt-2", habit.allCompleted ? "text-success-foreground" : "text-foreground")}>
                  Progress: {Math.round(habit.displayProgress)}/{Math.round(habit.adjustedDailyGoal)} {habit.unit}
                </p>
              </div>
            </div>

            {isLocked && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 ml-[72px]">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked. Complete {dependentHabitName} first.</span>
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground">
                    {isTrial ? "Session Target" : "Daily Goal"}
                  </p>
                  <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-black text-foreground">
                        {Math.round(habit.dailyGoal)} {habit.unit}
                        {habit.carryoverValue > 0 && (
                          <span className="ml-1 text-[10px] font-bold text-success"> (+{Math.round(habit.carryoverValue)} carryover)</span>
                        )}
                      </p>
                  </div>
              </div>
              <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground">Weekly Goal</p>
                  <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-black text-foreground">{Math.round(habit.weekly_goal)} {habit.unit}</p>
                  </div>
              </div>
          </div>
          
          <div className="w-full">
            <MacroGoalProgress 
              current={habit.weekly_completions} 
              total={habit.frequency_per_week} 
              label={isTrial ? "Weekly Session Log" : "Weekly Consistency"}
            />
          </div>
          <div className="w-full mt-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Daily Progress</p>
            <Progress
              value={Math.min(100, (habit.displayProgress / habit.adjustedDailyGoal) * 100)}
              className="h-1.5 [&>div]:bg-primary"
            />
          </div>

          {!habit.allCompleted && (
            <div className="grid gap-3">
              {showOnlyNext && nextCapsule ? (
                <>
                  <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-muted/40 z-0" />
                      <HabitCapsule
                        key={nextCapsule.id}
                        {...nextCapsule}
                        habitName={habit.name}
                        color={color}
                        onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress(habit, nextCapsule, actual, isComplete, mood)}
                        onUncomplete={() => handleCapsuleUncomplete(habit, nextCapsule)}
                        showMood={data.neurodivergentMode}
                      />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-dashed text-muted-foreground"
                    onClick={() => toggleShowAll(habit.key)}
                  >
                    <Layers className="w-3.5 h-3.5 mr-2" />
                    View all session parts ({habit.numChunks})
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  {habit.capsules.map((capsule: any) => (
                    <HabitCapsule
                      key={capsule.id}
                      {...capsule}
                      habitName={habit.name}
                      color={color}
                      onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress(habit, capsule, actual, isComplete, mood)}
                      onUncomplete={() => handleCapsuleUncomplete(habit, capsule)}
                      showMood={data.neurodivergentMode}
                    />
                  ))}
                  {habit.numChunks > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-[10px] font-black uppercase opacity-40 h-8"
                      onClick={() => toggleShowAll(habit.key)}
                    >
                      Simplify View (Focus Next)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {habit.allCompleted && !habit.is_fixed && (
            <div className="p-5 bg-success/10 rounded-[28px] border-2 border-dashed border-success/30 flex flex-col items-center gap-4 text-center animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center text-success">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg text-success">Goal Crushed!</h4>
                <p className="text-sm font-medium text-success-foreground opacity-80">You've hit your target for today.</p>
              </div>
              
              <div className="w-full">
                <HabitCapsule
                  id={`${habit.key}-bonus`}
                  habitKey={habit.key}
                  habitName={habit.name}
                  label="Bonus Session"
                  value={habit.capsules[0]?.value || 10}
                  unit={habit.unit}
                  measurementType={habit.measurement_type}
                  isCompleted={false}
                  isHabitComplete={true}
                  isFixed={false}
                  color={color}
                  onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress(habit, { index: 99 }, actual, isComplete, mood)}
                  onUncomplete={() => {}}
                  showMood={data.neurodivergentMode}
                />
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-3xl mx-auto w-full px-4 py-6 pb-32">
        <div className="mb-4">
           <HomeHeader
            dayCounter={data.daysActive}
            lastActiveText={data.lastActiveText}
            firstName={data.firstName}
            lastName={data.lastName}
            xp={data.xp}
            level={data.level}
          />
        </div>

        <main className="space-y-8">
          <TipCard tip={data.tip} bestTime={data.patterns.bestTime} isNeurodivergent={data.neurodivergentMode} />

          {anchorHabits.length > 0 && (
            <div className="space-y-4">
              <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-3 border-b border-border">
                <Anchor className="w-5 h-5 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Anchor Practices</h2>
                <div className="ml-auto h-px flex-grow bg-border" />
              </div>
              <Accordion 
                type="multiple" 
                value={expandedItems} 
                onValueChange={handleExpandedChange} 
                className="space-y-4"
              >
                {anchorHabits.map(renderHabitItem)}
              </Accordion>
            </div>
          )}

          <div className="space-y-4">
            <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-3 border-b border-border">
              <Zap className="w-5 h-5 text-warning" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Momentum</h2>
              <div className="ml-auto h-px flex-grow bg-border" />
            </div>
            <Accordion 
              type="multiple" 
              value={expandedItems} 
              onValueChange={handleExpandedChange} 
              className="space-y-4"
            >
              {dailyHabits.map(renderHabitItem)}
            </Accordion>
          </div>

          <GrowthGuide />

          <MadeWithDyad className="mt-12" />
        </main>
      </div>
    </div>
  );
};

export default Index;