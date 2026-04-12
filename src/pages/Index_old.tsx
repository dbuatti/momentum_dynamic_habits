"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { 
  CheckCircle2, Target, Anchor, Zap, 
  Layers, PlusCircle, Lock,
  AlertCircle, Sparkles, TrendingUp, Clock, Play,
  Check, CalendarDays, CalendarCheck, ChevronDown, ChevronUp, RotateCcw
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useCapsules } from "@/hooks/useCapsules";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TipCard } from "@/components/dashboard/TipCard";
import { calculateDynamicChunks } from "@/utils/progress-utils";
import { GrowthGuide } from "@/components/dashboard/GrowthGuide";
import { Link } from "react-router-dom";
import { habitIconMap } from '@/lib/habit-utils';
import { WeeklyAnchorCard } from "@/components/dashboard/WeeklyAnchorCard";
import { WeeklyObjectiveCard } from "@/components/dashboard/WeeklyObjectiveCard";
import { FixEmptyHabitKey } from "@/components/fixers/FixEmptyHabitKey";
import { ProcessedUserHabit } from "@/types/habit";
import { HabitAccordionItem } from "@/components/dashboard/HabitAccordionItem";
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getTodayDateString } from "@/utils/time-utils";

const Index = () => {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { isLoading: isCapsulesLoading, logCapsuleProgress, uncompleteCapsule } = useCapsules();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hasInitializedState, setHasInitializedState] = useState(false);
  const [showAllMomentum, setShowAllMomentum] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [skippedHabits, setSkippedHabits] = useState<string[]>([]);
  
  const prevCompletionsRef = useRef<Record<string, boolean>>({});
  const prevSectionCompletionsRef = useRef<Record<string, boolean>>({});
  const hasInitializedCompletions = useRef(false);

  const todayStr = useMemo(() => getTodayDateString(data?.timezone), [data?.timezone]);

  const habitWithEmptyKey = useMemo(() => {
    if (!data?.habits) return null;
    return data.habits.find(h => !h.habit_key || h.habit_key.trim() === '');
  }, [data?.habits]);

  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];

    return data.habits
      .filter(h => h.habit_key)
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

      let cumulativeProgressBeforeThisCapsule = 0;
      const capsules = Array.from({ length: numChunks }).map((_, i) => {
        const targetValue = (i + 1) * chunkValue;
        const threshold = habit.measurement_type === 'timer' ? 0.1 : 0.01;
        const isCompleted = progress >= (targetValue - threshold);
        const taskId = capsuleMapping[i] || null;

        let effectiveValue = chunkValue;
        if (i === 0 && habit.carryoverValue > 0) {
          effectiveValue = chunkValue + habit.carryoverValue;
        }
        
        let initialRemainingTimeSeconds = Math.round(effectiveValue * 60);
        
        if (!isCompleted && progress > cumulativeProgressBeforeThisCapsule) {
          const progressWithinThisCapsuleMinutes = progress - cumulativeProgressBeforeThisCapsule;
          const remainingMinutes = effectiveValue - progressWithinThisCapsuleMinutes;
          initialRemainingTimeSeconds = Math.round(Math.max(0, remainingMinutes * 60));
        }

        cumulativeProgressBeforeThisCapsule += effectiveValue;

        return {
          id: `${habit.key}-${i}`,
          index: i,
          habitKey: habit.key,
          label: habit.auto_chunking ? `Part ${i + 1}` : (habit.enable_chunks ? `Part ${i + 1}` : (habit.is_trial_mode ? 'Trial Session' : 'Daily Goal')),
          value: effectiveValue,
          unit: habit.unit,
          measurementType: habit.measurement_type,
          isCompleted,
          isHabitComplete: isOverallComplete,
          isFixed: habit.is_fixed,
          completedTaskId: taskId,
          completeOnFinish: (habit as any).complete_on_finish ?? true,
          initialRemainingTimeSeconds: initialRemainingTimeSeconds,
        };
      });

      return {
        ...habit,
        displayProgress: progress,
        capsules,
        allCompleted: isOverallComplete,
        numChunks,
        showExtraCapsule: isOverallComplete && !habit.is_fixed
      };
    }).sort((a, b) => {
      if (a.isLockedByDependency !== b.isLockedByDependency) return a.isLockedByDependency ? 1 : -1;
      if (a.allCompleted !== b.allCompleted) return a.allCompleted ? 1 : -1;
      if (a.category === 'anchor' && b.category !== 'anchor') return -1;
      if (a.category !== 'anchor' && b.category === 'anchor') return 1;
      
      const aIsWeeklyAnchor = a.category === 'anchor' && a.frequency_per_week === 1;
      const bIsWeeklyAnchor = b.category === 'anchor' && b.frequency_per_week === 1;

      if (aIsWeeklyAnchor && !bIsWeeklyAnchor) return -1;
      if (!aIsWeeklyAnchor && bIsWeeklyAnchor) return 1;

      if (!aIsWeeklyAnchor && !bIsWeeklyAnchor) {
        const aProgressRatio = a.adjustedDailyGoal > 0 ? a.displayProgress / a.adjustedDailyGoal : 0;
        const bProgressRatio = b.adjustedDailyGoal > 0 ? b.displayProgress / b.adjustedDailyGoal : 0;
        if (aProgressRatio !== bProgressRatio) return bProgressRatio - aProgressRatio;
      }
      
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [data?.habits, data?.neurodivergentMode]);

  const completedParts = data?.dailyMomentumParts.completed || 0;
  const totalParts = data?.dailyMomentumParts.total || 0;

  const visibleHabitsForDisplay = useMemo(() => {
    return habitGroups.filter(h => 
      h.is_visible && 
      !skippedHabits.includes(h.habit_key) &&
      (h.isScheduledForToday || h.category === 'anchor' || (h as any).is_weekly_goal)
    );
  }, [habitGroups, skippedHabits]);

  const anchorHabits = useMemo(() => visibleHabitsForDisplay.filter(h => h.category === 'anchor' && h.frequency_per_week === 1), [visibleHabitsForDisplay]);
  const weeklyObjectives = useMemo(() => visibleHabitsForDisplay.filter(h => (h as any).is_weekly_goal && h.category !== 'anchor'), [visibleHabitsForDisplay]);
  const dailyMomentumHabits = useMemo(() => visibleHabitsForDisplay.filter(h => !(h as any).is_weekly_goal && h.category !== 'anchor'), [visibleHabitsForDisplay]);

  const suggestedAction = useMemo(() => {
    if (!data?.habits || !data.sectionOrder) return null;
    const orderedSectionIds = data.sectionOrder;
    let firstEligibleHabit: ProcessedUserHabit | null = null;

    for (const sectionId of orderedSectionIds) {
      let currentSectionHabits: ProcessedUserHabit[] = [];
      if (sectionId === 'anchor') currentSectionHabits = anchorHabits;
      else if (sectionId === 'weekly_objective') currentSectionHabits = weeklyObjectives;
      else if (sectionId === 'daily_momentum') currentSectionHabits = dailyMomentumHabits;

      for (const habit of currentSectionHabits) {
        if (!habit.allCompleted && !habit.isLockedByDependency) {
          if (habit.isWithinWindow) return habit;
          if (!firstEligibleHabit) firstEligibleHabit = habit;
        }
      }
    }
    return firstEligibleHabit;
  }, [data, anchorHabits, weeklyObjectives, dailyMomentumHabits]);

  useEffect(() => {
    if (!data || hasInitializedState) return;
    
    // Load skipped habits for today
    const savedSkipped = localStorage.getItem(`skippedHabits:${todayStr}`);
    if (savedSkipped) setSkippedHabits(JSON.parse(savedSkipped));

    const storedExpanded = habitGroups.filter(h => localStorage.getItem(`habitAccordionState:${h.key}`) === 'expanded').map(h => h.key);
    setExpandedItems(storedExpanded); 
    const initialCollapsedState: Record<string, boolean> = {};
    data.sectionOrder.forEach(sectionId => {
      initialCollapsedState[sectionId] = localStorage.getItem(`sectionCollapsed:${sectionId}`) === 'true';
    });
    setCollapsedSections(initialCollapsedState);
    setHasInitializedState(true);
  }, [data, habitGroups, hasInitializedState, todayStr]);

  useEffect(() => {
    if (!data?.habits) return;
    const newCompletions: Record<string, boolean> = {};
    data.habits.forEach(habit => {
      const wasComplete = prevCompletionsRef.current[habit.habit_key] || false;
      const isComplete = habit.isComplete;
      
      if (hasInitializedCompletions.current && !wasComplete && isComplete) {
        setExpandedItems(prev => {
          const next = prev.filter(key => key !== habit.habit_key);
          localStorage.setItem(`habitAccordionState:${habit.habit_key}`, 'collapsed');
          return next;
        });
      }
      newCompletions[habit.habit_key] = isComplete;
    });
    prevCompletionsRef.current = newCompletions;

    const sectionCompletions: Record<string, boolean> = {
      anchor: anchorHabits.length > 0 && anchorHabits.every(h => h.allCompleted),
      weekly_objective: weeklyObjectives.length > 0 && weeklyObjectives.every(h => h.allCompleted),
      daily_momentum: dailyMomentumHabits.length > 0 && dailyMomentumHabits.every(h => h.allCompleted),
    };

    if (hasInitializedCompletions.current) {
      Object.entries(sectionCompletions).forEach(([sectionId, isComplete]) => {
        if (isComplete && !prevSectionCompletionsRef.current[sectionId]) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.7 }, colors: ['#6366f1', '#a855f7', '#22c55e'] });
        }
      });
    } else {
      hasInitializedCompletions.current = true;
    }
    
    prevSectionCompletionsRef.current = sectionCompletions;
  }, [data?.habits, anchorHabits, weeklyObjectives, dailyMomentumHabits]);

  const handleExpandedChange = (newValues: string[]) => {
    setExpandedItems(newValues);
    habitGroups.forEach(h => {
      localStorage.setItem(`habitAccordionState:${h.key}`, newValues.includes(h.key) ? 'expanded' : 'collapsed');
    });
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      localStorage.setItem(`sectionCollapsed:${sectionId}`, String(next[sectionId]));
      return next;
    });
  };

  const handleSkipHabit = (habitKey: string) => {
    const newSkipped = [...skippedHabits, habitKey];
    setSkippedHabits(newSkipped);
    localStorage.setItem(`skippedHabits:${todayStr}`, JSON.stringify(newSkipped));
  };

  const focusHabit = (habitKey: string) => {
    const habitSection = data?.sectionOrder.find(sectionId => {
      let sectionHabits: ProcessedUserHabit[] = [];
      if (sectionId === 'anchor') sectionHabits = anchorHabits;
      else if (sectionId === 'weekly_objective') sectionHabits = weeklyObjectives;
      else if (sectionId === 'daily_momentum') sectionHabits = dailyMomentumHabits;
      return sectionHabits.some(h => h.key === habitKey);
    });
    if (habitSection && collapsedSections[habitSection]) toggleSectionCollapse(habitSection);
    if (!expandedItems.includes(habitKey)) handleExpandedChange([...expandedItems, habitKey]);
    setTimeout(() => {
      const element = document.getElementById(`habit-card-${habitKey}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleLogRemaining = async (habit: any) => {
    const remaining = Math.max(0, habit.adjustedDailyGoal - habit.displayProgress);
    if (remaining <= 0) return;
    await logCapsuleProgress.mutateAsync({ habitKey: habit.key, index: 999, value: remaining, taskName: `${habit.name} completion`, isComplete: true });
  };

  const toggleShowAll = (habitKey: string) => setShowAllMomentum(prev => ({ ...prev, [habitKey]: !prev[habitKey] }));

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  if (habitWithEmptyKey) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <FixEmptyHabitKey habitId={habitWithEmptyKey.id} habitName={habitWithEmptyKey.name} onComplete={() => refetch()} />
        </div>
      </div>
    );
  }

  const renderSection = (sectionId: string) => {
    const sectionTitleMap: Record<string, string> = { 'anchor': 'Anchor Practices', 'weekly_objective': 'Weekly Objectives', 'daily_momentum': 'Daily Momentum' };
    const sectionIconMap: Record<string, React.ElementType> = { 'anchor': Anchor, 'weekly_objective': CalendarCheck, 'daily_momentum': Zap };
    const sectionColorMap: Record<string, string> = { 'anchor': 'text-primary', 'weekly_objective': 'text-indigo-500', 'daily_momentum': 'text-warning' };

    const IconComponent = sectionIconMap[sectionId];
    const title = sectionTitleMap[sectionId];
    const colorClass = sectionColorMap[sectionId];
    const isSectionCollapsed = collapsedSections[sectionId];

    let habitsToRender: ProcessedUserHabit[] = [];
    let emptyStateMessage: string = '';
    let emptyStateLinkText: string = '';

    if (sectionId === 'anchor') { habitsToRender = anchorHabits; emptyStateMessage = 'No anchor practices yet.'; emptyStateLinkText = 'Design your first anchor →'; }
    else if (sectionId === 'weekly_objective') { habitsToRender = weeklyObjectives; emptyStateMessage = 'No weekly objectives yet.'; emptyStateLinkText = 'Design your first weekly objective →'; }
    else if (sectionId === 'daily_momentum') { habitsToRender = dailyMomentumHabits; emptyStateMessage = 'No additional daily habits scheduled today.'; emptyStateLinkText = 'Design your first daily habit →'; }

    if (sectionId === 'daily_momentum' && habitsToRender.length === 0 && anchorHabits.length === 0 && weeklyObjectives.length === 0) {
      return (
        <div className="bg-card border-2 border-primary/20 rounded-[2rem] p-10 text-center space-y-6 shadow-xl">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto"><PlusCircle className="w-10 h-10 text-primary" /></div>
          <div className="space-y-2"><h3 className="text-2xl font-black tracking-tight">Your Dashboard is Empty</h3><p className="text-muted-foreground font-medium max-w-xs mx-auto">Build your routines using the Practice Lab or explore community templates.</p></div>
          <div className="flex flex-col gap-3"><Link to="/create-habit"><Button size="lg" className="w-full h-14 rounded-2xl font-black text-base shadow-lg shadow-primary/20">Open Practice Lab</Button></Link><Link to="/templates"><Button variant="outline" size="lg" className="w-full h-14 rounded-2xl font-black text-base border-2">Explore Templates</Button></Link></div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-3 border-b border-border cursor-pointer group" onClick={() => toggleSectionCollapse(sectionId)}>
          <IconComponent className={cn("w-5 h-5 transition-transform group-hover:scale-110", colorClass)} />
          <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", colorClass)}>{title}</h2>
          <div className="ml-auto h-px flex-grow bg-border" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">{isSectionCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}</Button>
        </div>
        <AnimatePresence initial={false}>
          {!isSectionCollapsed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
              {habitsToRender.length > 0 ? (
                <Accordion type="multiple" value={expandedItems} onValueChange={handleExpandedChange} className="space-y-4 pb-4">
                  {habitsToRender.map(habit => {
                    const dependentHabitName = data.habits.find(h => h.id === habit.dependent_on_habit_id)?.name || 'previous habit';
                    if (habit.category === 'anchor' && habit.frequency_per_week === 1) return <WeeklyAnchorCard key={habit.key} habit={habit} isLocked={habit.isLockedByDependency} dependentHabitName={dependentHabitName} />;
                    if (habit.is_weekly_goal && habit.category !== 'anchor') return <WeeklyObjectiveCard key={habit.key} habit={habit} isLocked={habit.isLockedByDependency} dependentHabitName={dependentHabitName} />;
                    return <HabitAccordionItem key={habit.key} habit={habit} neurodivergentMode={data.neurodivergentMode} expandedItems={expandedItems} handleExpandedChange={handleExpandedChange} logCapsuleProgress={logCapsuleProgress} uncompleteCapsule={uncompleteCapsule} showAllMomentum={showAllMomentum} toggleShowAll={toggleShowAll} handleLogRemaining={handleLogRemaining} dependentHabitName={dependentHabitName} onSkip={handleSkipHabit} />;
                  })}
                </Accordion>
              ) : (
                <div className="p-6 bg-muted/20 border-2 border-dashed border-border rounded-3xl text-center mb-4"><p className="text-sm font-bold text-muted-foreground">{emptyStateMessage}</p><Link to="/create-habit"><Button variant="link" className="text-xs font-black uppercase text-primary mt-1">{emptyStateLinkText}</Button></Link></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-3xl mx-auto w-full px-4 py-6 pb-32">
        <HomeHeader dayCounter={data.daysActive} lastActiveText={data.lastActiveText} firstName={data.firstName} lastName={data.lastName} xp={data.xp} level={data.level} tasksCompletedToday={completedParts} dailyChallengeTarget={totalParts} />
        <main className="space-y-8">
          {data.patterns.streak > 0 && completedParts === 0 && new Date().getHours() >= 20 && (
            <Card className="bg-destructive/10 border-destructive border-2 rounded-2xl animate-pulse"><CardContent className="p-4 flex items-center gap-3"><AlertCircle className="w-6 h-6 text-destructive" /><div><p className="font-black text-sm text-destructive uppercase tracking-tight">Streak at Risk!</p><p className="text-xs font-bold opacity-80">Log something now to protect your {data.patterns.streak}-day streak.</p></div></CardContent></Card>
          )}
          {suggestedAction && (
            <Card className="rounded-[2.5rem] border-2 border-primary overflow-hidden shadow-xl">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg">{React.createElement(habitIconMap[suggestedAction.key] || Target, { className: "w-10 h-10" })}</div>
                <div className="flex-grow text-center sm:text-left space-y-2"><div className="flex items-center justify-center sm:justify-start gap-2"><Clock className="w-4 h-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Practice Focus</span></div><h2 className="text-2xl font-black tracking-tight leading-tight uppercase italic">{suggestedAction.name}</h2><p className="text-sm font-medium text-muted-foreground">{suggestedAction.isWithinWindow ? "Perfect timing for this practice." : "Ready for your next session?"} Let's keep the momentum going.</p></div>
                <Button className="w-full sm:w-auto h-16 px-8 rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-transform" onClick={() => focusHabit(suggestedAction.key)}><Play className="w-5 h-5 mr-2 fill-current" /> Get Started</Button>
              </CardContent>
            </Card>
          )}
          <TipCard tip={data.tip} bestTime={data.patterns.bestTime} isNeurodivergent={data.neurodivergentMode} />
          {data.sectionOrder.map(sectionId => <React.Fragment key={sectionId}>{renderSection(sectionId)}</React.Fragment>)}
          
          {skippedHabits.length > 0 && (
            <div className="pt-4 text-center">
              <Button 
                variant="ghost" 
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
                onClick={() => {
                  setSkippedHabits([]);
                  localStorage.removeItem(`skippedHabits:${todayStr}`);
                }}
              >
                <RotateCcw className="w-3 h-3 mr-2" /> Restore {skippedHabits.length} skipped habits
              </Button>
            </div>
          )}

          <GrowthGuide />
          <MadeWithDyad className="mt-12" />
        </main>
      </div>
    </div>
  );
};

export default Index;