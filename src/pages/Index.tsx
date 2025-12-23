"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { 
  BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, 
  CheckCircle2, Timer, Target, Anchor, Clock, Zap, ChevronDown, ChevronUp,
  Layers, TrendingUp, ShieldCheck, Info
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

const habitIconMap: Record<string, React.ElementType> = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home,
  projectwork: Code,
  teeth_brushing: Sparkles,
  medication: Pill,
};

type HabitColor = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo';
const habitColorMap: Record<string, HabitColor> = {
  pushups: 'orange', meditation: 'blue', kinesiology: 'green', piano: 'purple',
  housework: 'red', projectwork: 'indigo', teeth_brushing: 'blue', medication: 'purple',
};

const Index = () => {
  const { data, isLoading, isError } = useDashboardData();
  const { dbCapsules, isLoading: isCapsulesLoading, completeCapsule, uncompleteCapsule } = useCapsules();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const { mutate: logHabit, unlog } = useHabitLog();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showAllMomentum, setShowAllMomentum] = useState<Record<string, boolean>>({});

  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];

    return data.habits
      .filter(habit => habit.is_visible) // Filter by is_visible
      .map(habit => {
      const goal = habit.dailyGoal;
      const progress = habit.dailyProgress;
      
      const { numChunks, chunkValue } = calculateDynamicChunks(
        habit.key,
        goal,
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
        allCompleted: progress >= goal,
        numChunks,
      };
    });
  }, [data?.habits, dbCapsules, data?.neurodivergentMode]);

  const anchorHabits = useMemo(() => habitGroups.filter(h => h.category === 'anchor' && h.is_visible), [habitGroups]);
  const dailyHabits = useMemo(() => {
    return habitGroups
      .filter(h => h.category === 'daily' && h.is_visible)
      .sort((a, b) => (a.allCompleted === b.allCompleted ? 0 : a.allCompleted ? 1 : -1)); // Completed habits last
  }, [habitGroups]);

  useEffect(() => {
    if (habitGroups.length === 0) return;
    if (expandedItems.length === 0) {
      setExpandedItems(habitGroups.filter(h => h.is_visible && !h.allCompleted && h.isWithinWindow).map(h => h.key));
    }
  }, [habitGroups]);

  const handleCapsuleComplete = (habit: any, capsule: any, actualValue: number, mood?: string) => {
    logHabit({ habitKey: habit.key, value: actualValue, taskName: `${habit.name} session` });
    completeCapsule.mutate({ habitKey: habit.key, index: capsule.index, value: actualValue, mood });
  };

  const handleCapsuleUncomplete = (habit: any, capsule: any) => {
    uncompleteCapsule.mutate({ habitKey: habit.key, index: capsule.index });
    unlog({ habitKey: habit.key, taskName: `${habit.name} session` });
  };

  const toggleShowAll = (habitKey: string) => {
    setShowAllMomentum(prev => ({ ...prev, [habitKey]: !prev[habitKey] }));
  };

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  const renderHabitItem = (habit: any) => {
    const Icon = habitIconMap[habit.key] || Timer;
    const color = habitColorMap[habit.key] || 'blue';
    const isGrowth = !habit.is_fixed && !habit.is_trial_mode;
    const isTrial = habit.is_trial_mode;
    
    const accentColor = {
        orange: 'text-orange-950 bg-orange-50 border-orange-200',
        blue: 'text-blue-950 bg-blue-50 border-blue-200',
        green: 'text-green-950 bg-green-50 border-green-200',
        purple: 'text-purple-950 bg-purple-50 border-purple-200',
        red: 'text-red-950 bg-red-50 border-red-200',
        indigo: 'text-indigo-950 bg-indigo-50 border-indigo-200',
    }[color];

    const nextCapsule = habit.capsules.find((c: any) => !c.isCompleted);
    const completedCount = habit.capsules.filter((c: any) => c.isCompleted).length;
    
    // Simplification: In daily habits or trial habits, only show the next capsule if multiple exist
    // This reduces cognitive load significantly
    const showOnlyNext = !showAllMomentum[habit.key] && habit.numChunks > 1;

    return (
      <AccordionItem
        key={habit.key}
        value={habit.key}
        className={cn(
          "border-2 rounded-[32px] shadow-sm overflow-hidden transition-all duration-300",
          habit.allCompleted ? "opacity-50 grayscale-[0.3] border-muted bg-muted/5" : cn(accentColor, "shadow-md"),
          !habit.isWithinWindow && !habit.allCompleted && "opacity-75"
        )}
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline">
          <div className="flex flex-col w-full text-left gap-4">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-black/5",
                    habit.allCompleted ? "bg-white" : "bg-white/90"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-grow pr-2">
                    <h3 className="font-black text-lg flex items-center gap-2 leading-tight truncate">
                      {habit.name}
                      {habit.allCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                        habit.allCompleted ? "bg-green-100 text-green-700 border-green-200" :
                        habit.isWithinWindow ? "bg-primary text-white border-transparent" : "bg-muted text-muted-foreground border-transparent"
                      )}>
                        {habit.allCompleted ? "Goal Met" : (habit.isWithinWindow ? "Ready Now" : "Restricted")}
                      </span>
                      {isTrial && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          Trial Mode
                        </span>
                      )}
                      {isGrowth && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          Growth Mode
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:flex flex-col items-end text-right">
                    <p className="text-xl font-black">{habit.dailyProgress}/{habit.dailyGoal}</p>
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">{habit.unit} session</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-black/5 pt-4">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                      {isTrial ? "Session Target" : "Daily Goal"}
                    </p>
                    <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 opacity-40" />
                        <p className="text-sm font-black">{habit.dailyGoal} {habit.unit}</p>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Weekly Goal</p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 opacity-40" />
                        <p className="text-sm font-black">{habit.weekly_goal} {habit.unit}</p>
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
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
          {/* Enhanced Trial Mode Context */}
          {isTrial && !habit.allCompleted && (
            <TrialStatusCard 
              habitName={habit.name} 
              sessionsPerWeek={habit.frequency_per_week} 
              duration={habit.dailyGoal} 
              unit={habit.unit} 
              completionsInPlateau={habit.growth_stats.completions}
              plateauDaysRequired={habit.growth_stats.required}
            />
          )}

          {/* Adaptive Insights (Growth mode only) */}
          {isGrowth && !habit.allCompleted && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
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
                      onComplete={(actual, mood) => handleCapsuleComplete(habit, nextCapsule, actual, mood)}
                      onUncomplete={() => handleCapsuleUncomplete(habit, nextCapsule)}
                      showMood={data.neurodivergentMode}
                    />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-dashed"
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
                    onComplete={(actual, mood) => handleCapsuleComplete(habit, capsule, actual, mood)}
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
      <div className="max-w-lg mx-auto w-full px-4 py-6 pb-32">
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
              <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-3 border-b border-black/5">
                <Anchor className="w-5 h-5 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Anchor Practices</h2>
                <div className="ml-auto h-px flex-grow bg-black/5" />
              </div>
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
                {anchorHabits.map(renderHabitItem)}
              </Accordion>
            </div>
          )}

          {/* Daily Momentum Section */}
          <div className="space-y-4">
            <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-3 border-b border-black/5">
              <Zap className="w-5 h-5 text-orange-500" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Momentum</h2>
              <div className="ml-auto h-px flex-grow bg-black/5" />
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