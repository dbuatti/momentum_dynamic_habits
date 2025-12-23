"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { 
  BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, 
  CheckCircle2, Timer, Target, Anchor, Clock, Zap, ChevronDown, ChevronUp,
  Layers
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

    return data.habits.map(habit => {
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

  const anchorHabits = useMemo(() => habitGroups.filter(h => h.category === 'anchor' && h.isVisible), [habitGroups]);
  const dailyHabits = useMemo(() => {
    return habitGroups
      .filter(h => h.category === 'daily' && h.isVisible)
      .sort((a, b) => (a.allCompleted === b.allCompleted ? 0 : a.allCompleted ? 1 : -1));
  }, [habitGroups]);

  useEffect(() => {
    if (habitGroups.length === 0) return;
    if (expandedItems.length === 0) {
      setExpandedItems(habitGroups.filter(h => h.isVisible && !h.allCompleted && h.isWithinWindow).map(h => h.key));
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
    const showOnlyNext = habit.category === 'daily' && !showAllMomentum[habit.key] && habit.numChunks > 1;

    return (
      <AccordionItem
        key={habit.key}
        value={habit.key}
        className={cn(
          "border-2 rounded-3xl shadow-sm overflow-hidden transition-all bg-card",
          habit.allCompleted ? "opacity-50 grayscale-[0.3]" : accentColor,
          !habit.isWithinWindow && !habit.allCompleted && "opacity-75"
        )}
      >
        <AccordionTrigger className="px-5 py-4 hover:no-underline">
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-center gap-4 text-left min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-black/5">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-grow pr-2">
                <h3 className="font-black text-base flex items-center gap-1.5 leading-tight truncate">
                  {habit.name}
                  {habit.allCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    habit.allCompleted ? "bg-green-100 text-green-700" :
                    habit.isWithinWindow ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {habit.allCompleted ? "Goal Reached" : (habit.isWithinWindow ? "Available" : "Later")}
                  </span>
                  <p className="text-[11px] font-bold opacity-70">
                    {completedCount}/{habit.numChunks} parts
                  </p>
                </div>
              </div>
            </div>
            
            {!habit.allCompleted && (
              <div className="hidden sm:block w-24">
                <MacroGoalProgress current={habit.weekly_completions} total={habit.frequency_per_week} />
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 pt-0 space-y-4">
          <div className="grid gap-2.5">
            {showOnlyNext && nextCapsule ? (
              <>
                <HabitCapsule
                  key={nextCapsule.id}
                  {...nextCapsule}
                  habitName={habit.name}
                  color={color}
                  onComplete={(actual, mood) => handleCapsuleComplete(habit, nextCapsule, actual, mood)}
                  onUncomplete={() => handleCapsuleUncomplete(habit, nextCapsule)}
                  showMood={data.neurodivergentMode}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground h-8"
                  onClick={() => toggleShowAll(habit.key)}
                >
                  <Layers className="w-3 h-3 mr-1.5" />
                  Show remaining {habit.numChunks - completedCount} parts
                </Button>
              </>
            ) : (
              <>
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
                {habit.category === 'daily' && habit.numChunks > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground h-8"
                    onClick={() => toggleShowAll(habit.key)}
                  >
                    Simplify View
                  </Button>
                )}
              </>
            )}
          </div>
          
          <div className="sm:hidden border-t border-black/5 pt-3">
             <MacroGoalProgress current={habit.weekly_completions} total={habit.frequency_per_week} />
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
              <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-2 border-b border-black/5">
                <Anchor className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Anchor Practices</h2>
                <div className="ml-auto h-px flex-grow bg-black/5" />
              </div>
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-3">
                {anchorHabits.map(renderHabitItem)}
              </Accordion>
            </div>
          )}

          {/* Daily Momentum Section */}
          <div className="space-y-4">
            <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-sm py-3 flex items-center gap-2 border-b border-black/5">
              <Zap className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Momentum</h2>
              <div className="ml-auto h-px flex-grow bg-black/5" />
            </div>
            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-3">
              {dailyHabits.map(renderHabitItem)}
            </Accordion>
          </div>

          <MadeWithDyad className="mt-12" />
        </main>
      </div>
    </div>
  );
};

export default Index;