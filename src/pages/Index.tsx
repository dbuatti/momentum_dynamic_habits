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
import { showSuccess } from "@/utils/toast";
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { useSession } from "@/contexts/SessionContext"; // Import useSession for queryClient invalidation
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient

const Index = () => {
  const { data, isLoading, isError } = useDashboardData();
  const { dbCapsules, isLoading: isCapsulesLoading, completeCapsule, uncompleteCapsule } = useCapsules();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const { mutate: logHabit, unlog } = useHabitLog();
  const { session } = useSession(); // Get session for queryClient invalidation
  const queryClient = useQueryClient(); // Initialize useQueryClient
  
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showAllMomentum, setShowAllMomentum] = useState<Record<string, boolean>>({});

  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];

    // Create a map for quick lookup of habit completion status
    const habitCompletionStatus = new Map<string, boolean>();
    data.habits.forEach(h => habitCompletionStatus.set(h.key, h.isComplete));

    return data.habits
      .filter(habit => habit.is_visible) // Filter by is_visible
      .map(habit => {
      const goal = habit.adjustedDailyGoal; // Use adjustedDailyGoal for display and chunking
      const progress = habit.dailyProgress;
      
      const { numChunks, chunkValue } = calculateDynamicChunks(
        habit.key,
        goal, // Pass adjustedDailyGoal to chunk calculation
        habit.unit,
        data.neurodivergentMode,
        habit.auto_chunking,
        habit.num_chunks,
        habit.chunk_duration
      );

      const capsules = Array.from({ length: numChunks }).map((_, i) => {
        const dbCapsule = dbCapsules?.find(c => c.habit_key === habit.key && c.capsule_index === i);
        const threshold = (i + 1) * chunkValue;
        const isCompleted = dbCapsule?.is_completed || progress >= (i === numChunks - 1 ? goal : threshold);

        return {
          id: `${habit.key}-${i}`,
          habitKey: habit.key,
          index: i,
          label: habit.auto_chunking ? `Part ${i + 1}` : (habit.enable_chunks ? `Part ${i + 1}` : (habit.is_trial_mode ? 'Trial Session' : 'Daily Goal')),
          value: chunkValue,
          initialValue: Math.max(0, Math.min(chunkValue, progress - (i * chunkValue))),
          unit: habit.unit,
          isCompleted,
          scheduledTime: dbCapsule?.scheduled_time,
        };
      });

      return {
        ...habit,
        capsules,
        allCompleted: progress >= goal, // Check against adjusted goal
        numChunks,
        // isLockedByDependency is already calculated in useDashboardData
      };
    }).sort((a, b) => {
      // Sort order:
      // 1. Unlocked habits before locked habits
      // 2. Incomplete habits before complete habits
      // 3. Anchor habits before daily habits
      // 4. Then by progress (least complete first)
      // 5. Finally by name
      
      // 1. Unlocked vs Locked
      if (a.isLockedByDependency !== b.isLockedByDependency) {
        return a.isLockedByDependency ? 1 : -1;
      }

      // 2. Incomplete vs Complete
      if (a.allCompleted !== b.allCompleted) {
        return a.allCompleted ? 1 : -1;
      }

      // 3. Anchor vs Daily
      if (a.category === 'anchor' && b.category !== 'anchor') return -1;
      if (a.category !== 'anchor' && b.category === 'anchor') return 1;

      // 4. Progress
      const aProgressRatio = a.adjustedDailyGoal > 0 ? a.dailyProgress / a.adjustedDailyGoal : 0; // Use adjustedDailyGoal
      const bProgressRatio = b.adjustedDailyGoal > 0 ? b.dailyProgress / b.adjustedDailyGoal : 0; // Use adjustedDailyGoal
      if (aProgressRatio !== bProgressRatio) {
        return aProgressRatio - bProgressRatio;
      }

      // 5. Name - Ensure names are strings before comparison
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [data?.habits, dbCapsules, data?.neurodivergentMode]);

  const anchorHabits = useMemo(() => habitGroups.filter(h => h.category === 'anchor' && h.is_visible), [habitGroups]);
  const dailyHabits = useMemo(() => habitGroups.filter(h => h.category !== 'anchor' && h.is_visible), [habitGroups]);

  useEffect(() => {
    if (habitGroups.length === 0) return;
    // Expand all incomplete, unlocked anchor/trial habits by default
    const initialExpanded = habitGroups
      .filter(h => h.is_visible && !h.allCompleted && !h.isLockedByDependency && (h.category === 'anchor' || h.is_trial_mode))
      .map(h => h.key);
    
    // Only update if the expanded items are different to prevent infinite loop
    if (JSON.stringify(initialExpanded.sort()) !== JSON.stringify(expandedItems.sort())) {
      setExpandedItems(initialExpanded);
    }
  }, [habitGroups]); // Only depend on habitGroups

  // Renamed from handleCapsuleComplete to handleCapsuleProgress
  const handleCapsuleProgress = (habit: any, capsule: any, actualValue: number, isComplete: boolean, mood?: string) => {
    if (isComplete) {
      logHabit({ habitKey: habit.key, value: actualValue, taskName: `${habit.name} session` });
      completeCapsule.mutate({ habitKey: habit.key, index: capsule.index, value: actualValue, mood });
    } else {
      // Log partial progress without marking capsule as complete
      logHabit({ habitKey: habit.key, value: actualValue, taskName: `${habit.name} partial session` });
      // Invalidate dashboard data to refetch and update dailyProgress for the habit
      // This will cause the HabitCapsule to re-render with an updated initialValue
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
    }
  };

  const handleCapsuleUncomplete = (habit: any, capsule: any) => {
    uncompleteCapsule.mutate({ habitKey: habit.key, index: capsule.index });
    unlog({ habitKey: habit.key, taskName: `${habit.name} session` });
  };

  const toggleShowAll = (habitKey: string) => {
    setShowAllMomentum(prev => ({ ...prev, [habitKey]: !prev[habitKey] }));
  };

  const handleOverrideDependency = (habitKey: string) => {
    // For now, just show a success message and allow the user to proceed.
    // A more robust solution might involve a temporary "override" state or logging.
    showSuccess("Dependency overridden for this session. Proceed with caution!");
    // Optionally, you could add this habitKey to a temporary "overridden" state
    // that allows it to be interacted with for the current day.
    // For simplicity, we'll just let the user know and they can click the habit again.
  };

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  const renderHabitItem = (habit: any) => {
    const Icon = habitIconMap[habit.key] || habitIconMap.custom_habit; // Use custom_habit as a fallback
    const color = habitColorMap[habit.key] || 'blue';
    const isGrowth = !habit.is_fixed && !habit.is_trial_mode;
    const isTrial = habit.is_trial_mode;
    
    // Use the custom habit- colors defined in globals.css and tailwind.config.ts
    const accentColorClasses = {
        orange: 'bg-habit-orange border-habit-orange-border text-habit-orange-foreground',
        blue: 'bg-habit-blue border-habit-blue-border text-habit-blue-foreground',
        green: 'bg-habit-green border-habit-green-border text-habit-green-foreground',
        purple: 'bg-habit-purple border-habit-purple-border text-habit-purple-foreground',
        red: 'bg-habit-red border-habit-red-border text-habit-red-foreground',
        indigo: 'bg-habit-indigo border-habit-indigo-border text-habit-indigo-foreground',
    }[color];

    const nextCapsule = habit.capsules.find((c: any) => !c.isCompleted);
    const completedCount = habit.capsules.filter((c: any) => c.isCompleted).length;
    
    // Simplification: In daily habits or trial habits, only show the next capsule if multiple exist
    // This reduces cognitive load significantly
    const showOnlyNext = !showAllMomentum[habit.key] && habit.numChunks > 1;

    const isLocked = habit.isLockedByDependency;
    const dependentHabitName = data.habits.find(h => h.id === habit.dependent_on_habit_id)?.name || 'previous habit';

    return (
      <AccordionItem
        key={habit.key}
        value={habit.key}
        className={cn(
          "border-2 rounded-3xl mb-4 overflow-hidden transition-all duration-500",
          habit.allCompleted ? "opacity-50 grayscale-[0.3] border-muted bg-muted/5" : cn(accentColorClasses, "shadow-md"),
          !habit.isWithinWindow && !habit.allCompleted && "opacity-75",
          isLocked && "opacity-40 grayscale-[0.5]" // Apply styles for locked habits
        )}
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline group">
          <div className="flex flex-col w-full text-left gap-2">
            <div className="flex items-center gap-5 text-left w-full">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border",
                habit.allCompleted ? "bg-card" : "bg-card/90"
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
                      ? "bg-success-background border-success-border text-primary dark:text-success-foreground" // Adjusted text color for light mode
                      : habit.isWithinWindow 
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "bg-muted text-muted-foreground border-transparent"
                  )}>
                    {habit.allCompleted ? "Goal Met" : (habit.isWithinWindow ? "Ready Now" : "Restricted")}
                  </span>
                  {isTrial && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-info-background text-info-foreground border border-info-border">
                      Trial Mode
                    </span>
                  )}
                  {isGrowth && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-habit-purple/20 text-habit-purple-foreground border border-habit-purple-border">
                      Growth Mode
                    </span>
                  )}
                  {habit.is_fixed && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                      Fixed Mode
                    </span>
                  )}
                </div>
                {/* Daily Progress below name */}
                <p className={cn("text-sm font-bold mt-2", habit.allCompleted ? "text-muted-foreground" : "text-foreground")}>
                  Progress: {Math.round(habit.dailyProgress)}/{Math.round(habit.adjustedDailyGoal)} {habit.unit}
                </p>
              </div>
            </div>

            {isLocked && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 ml-[72px]">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked. Complete {dependentHabitName} first.</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent accordion from toggling
                    handleOverrideDependency(habit.key);
                  }}
                >
                  (Override)
                </Button>
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
          {/* Daily Progress Bar */}
          <div className="w-full mt-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Daily Progress</p>
            <Progress
              value={(habit.dailyProgress / habit.adjustedDailyGoal) * 100}
              className="h-1.5 [&>div]:bg-primary"
            />
          </div>

          {/* Enhanced Trial Mode Context */}
          {isTrial && !habit.allCompleted && (
            <TrialStatusCard 
              habitName={habit.name} 
              sessionsPerWeek={habit.frequency_per_week} 
              duration={habit.dailyGoal} 
              unit={habit.unit} 
              completionsInPlateau={habit.growth_stats.completions}
              plateauDaysRequired={habit.growth_stats.required}
              className="mt-6"
            />
          )}

          {/* Adaptive Insights (Growth mode only) */}
          {isGrowth && !habit.allCompleted && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3 mt-6">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest">Stability Status</p>
                        <span className="text-[10px] font-black text-primary">{habit.growth_stats.completions}/{habit.growth_stats.required} days</span>
                    </div>
                    <Progress value={(habit.growth_stats.completions / habit.growth_stats.required) * 100} className="h-1 [&>div]:bg-primary" />
                    <p className="text-[11px] font-medium opacity-60 mt-2 leading-tight">
                        {habit.growth_stats.daysRemaining} consistent days until dynamic goal increase ({habit.growth_stats.phase === 'frequency' ? 'Frequency' : 'Duration'} phase).
                    </p>
                </div>
            </div>
          )}

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
                      onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress(habit, nextCapsule, actual, isComplete, mood)} // Updated prop name
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
                    onLogProgress={(actual, isComplete, mood) => handleCapsuleProgress(habit, capsule, actual, isComplete, mood)} // Updated prop name
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
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-3xl mx-auto w-full px-4 py-6 pb-32"> {/* Adjusted max-w-2xl to max-w-3xl */}
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

          {/* Anchor Section */}
          {anchorHabits.length > 0 && (
            <div className="space-y-4">
              <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-3 border-b border-border">
                <Anchor className="w-5 h-5 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Anchor Practices</h2>
                <div className="ml-auto h-px flex-grow bg-border" />
              </div>
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
                {anchorHabits.map(renderHabitItem)}
              </Accordion>
            </div>
          )}

          {/* Daily Momentum Section */}
          <div className="space-y-4">
            <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-3 border-b border-border">
              <Zap className="w-5 h-5 text-warning" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Momentum</h2>
              <div className="ml-auto h-px flex-grow bg-border" />
            </div>
            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
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