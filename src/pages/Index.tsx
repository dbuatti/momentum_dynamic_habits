"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, LayoutGrid, ListTodo, Zap, Lock, CheckCircle2, Timer, Sparkle, Target, Calendar, Anchor, Clock } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { HabitCapsule } from "@/components/dashboard/HabitCapsule";
import { useCapsules } from "@/hooks/useCapsules";
import { useHabitLog } from "@/hooks/useHabitLog";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TipCard } from "@/components/dashboard/TipCard";
import { calculateDynamicChunks } from "@/utils/progress-utils";

const habitIconMap: { [key: string]: React.ElementType } = {
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
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { dbCapsules, isLoading: isCapsulesLoading, completeCapsule, uncompleteCapsule } = useCapsules();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const { mutate: logHabit, unlog } = useHabitLog();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
        
        // Progress based completion
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

      const allCompleted = progress >= goal;
      
      return {
        ...habit,
        capsules,
        allCompleted,
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

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  const renderHabitItem = (habit: any) => {
    const Icon = habitIconMap[habit.key] || Timer;
    const color = habitColorMap[habit.key] || 'blue';
    const accentColor = {
        orange: 'text-orange-900 bg-orange-50 border-orange-200',
        blue: 'text-blue-900 bg-blue-50 border-blue-200',
        green: 'text-green-900 bg-green-50 border-green-200',
        purple: 'text-purple-900 bg-purple-50 border-purple-200',
        red: 'text-red-900 bg-red-50 border-red-200',
        indigo: 'text-indigo-900 bg-indigo-50 border-indigo-200',
    }[color];

    const completedChunksCount = habit.capsules.filter(c => c.isCompleted).length;

    return (
      <AccordionItem
        key={habit.key}
        value={habit.key}
        className={cn(
          "border-2 rounded-3xl shadow-sm overflow-hidden transition-all bg-card",
          habit.allCompleted ? "opacity-60 grayscale-[0.2]" : accentColor,
          !habit.isWithinWindow && !habit.allCompleted && "opacity-75"
        )}
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-black/5">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg flex items-center gap-2">
                  {habit.name}
                  {habit.allCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm opacity-80 font-bold">
                    {habit.numChunks > 1 ? `${completedChunksCount}/${habit.numChunks} parts` : (habit.is_trial_mode ? `Trial Session` : `${habit.dailyGoal} ${habit.unit} goal`)}
                  </p>
                  {!habit.allCompleted && (
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1",
                      habit.isWithinWindow ? "bg-green-600 text-white shadow-sm" : "bg-muted text-muted-foreground"
                    )}>
                      {habit.isWithinWindow ? (
                        <>Available now</>
                      ) : (
                        <><Clock className="w-2.5 h-2.5" /> Later ({habit.window_start}-{habit.window_end})</>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2 space-y-4">
          <div className="grid gap-3">
            {habit.capsules.map(capsule => (
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
          </div>
          {habit.is_trial_mode && (
              <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-black/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Entry Stabilization Phase
                </p>
                <p className="text-xs font-medium mt-1">Focus on showing up. Dynamic growth unlocks after stabilization.</p>
              </div>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-lg mx-auto w-full px-4 py-6 pb-24">
        <HomeHeader
          dayCounter={data.daysActive}
          lastActiveText={data.lastActiveText}
          firstName={data.firstName}
          lastName={data.lastName}
          xp={data.xp}
          level={data.level}
        />

        <main className="space-y-8 mt-6">
          <TipCard tip={data.tip} bestTime={data.patterns.bestTime} isNeurodivergent={data.neurodivergentMode} />

          {/* Anchor Practices Section */}
          {anchorHabits.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-black uppercase tracking-widest text-primary/80">Anchor Practices</h2>
                </div>
              </div>
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
                {anchorHabits.map(renderHabitItem)}
              </Accordion>
            </div>
          )}

          <Separator className="opacity-50" />

          {/* Daily Momentum Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Zap className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Daily Momentum</h2>
            </div>
            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
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