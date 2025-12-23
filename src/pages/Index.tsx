"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, LayoutGrid, ListTodo, Zap, Lock, CheckCircle2, Timer, ChevronRight, Sparkle } from "lucide-react";
import { TodaysProgressCard } from "@/components/dashboard/TodaysProgressCard";
import { HabitDetailCard } from "@/components/dashboard/HabitDetailCard";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
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
import { toast } from "sonner";

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
  pushups: 'orange',
  meditation: 'blue',
  kinesiology: 'green',
  piano: 'purple',
  housework: 'red',
  projectwork: 'indigo',
  teeth_brushing: 'blue',
  medication: 'purple',
};

const Index = () => {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { dbCapsules, isLoading: isCapsulesLoading, completeCapsule, uncompleteCapsule } = useCapsules();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const { mutate: logHabit, unlog } = useHabitLog();

  const [viewMode, setViewMode] = useState<'capsules' | 'overview'>('capsules');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const prevCompletions = useRef<Record<string, boolean>>({});

  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];

    return data.habits.map(habit => {
      const goal = habit.dailyGoal;
      const progress = habit.dailyProgress;
      const isReps = habit.unit === 'reps';
      const isMinutes = habit.unit === 'min';

      let numCapsules = 1;
      let capsuleValue = goal;

      if (habit.key === 'pushups' && isReps) {
        const idealSetSize = Math.min(7, Math.max(5, Math.ceil(goal / 4)));
        numCapsules = Math.max(1, Math.ceil(goal / idealSetSize));
        capsuleValue = idealSetSize;
      } else if (isMinutes) {
        // Simplified Logic: Only split into parts if duration is significant (>= 60m)
        // This ensures 30m Housework stays as 1 session (0/1).
        if (goal >= 60) {
          numCapsules = 4;
          capsuleValue = 15;
        } else {
          numCapsules = 1;
          capsuleValue = goal;
        }
      }

      const capsules = Array.from({ length: numCapsules }).map((_, i) => {
        const dbCapsule = dbCapsules?.find(c => c.habit_key === habit.key && c.capsule_index === i);
        const startOfThisCapsule = i * capsuleValue;
        const initialValue = Math.max(0, Math.min(capsuleValue, progress - startOfThisCapsule));
        const isCompleted = dbCapsule?.is_completed || initialValue >= capsuleValue || (i === numCapsules - 1 && progress >= goal);

        return {
          id: `${habit.key}-${i}`,
          habitKey: habit.key,
          index: i,
          label: numCapsules === 1 ? 'Session' : (habit.key === 'pushups' ? `Set ${i + 1}` : `Part ${i + 1}`),
          value: i === numCapsules - 1 ? goal - capsuleValue * (numCapsules - 1) : capsuleValue,
          initialValue,
          unit: habit.unit,
          isCompleted,
          scheduledTime: dbCapsule?.scheduled_time,
        };
      });

      const allCompleted = (goal > 0 && progress >= goal) || (capsules.length > 0 && capsules.every(c => c.isCompleted));
      
      return {
        ...habit,
        capsules,
        allCompleted,
        completedCapsulesCount: capsules.filter(c => c.isCompleted).length,
        totalCapsulesCount: numCapsules,
      };
    });
  }, [data?.habits, dbCapsules]);

  // Split habits into two priority groups based on DB category
  const anchorHabits = useMemo(() => habitGroups.filter(h => h.category === 'anchor'), [habitGroups]);
  const dailyHabits = useMemo(() => {
    return habitGroups
      .filter(h => h.category === 'daily')
      .sort((a, b) => {
        if (a.allCompleted === b.allCompleted) return 0;
        return a.allCompleted ? 1 : -1;
      });
  }, [habitGroups]);

  useEffect(() => {
    if (habitGroups.length === 0) return;

    if (expandedItems.length === 0) {
      const incompleteKeys = habitGroups.filter(h => !h.allCompleted).map(h => h.key);
      setExpandedItems(incompleteKeys);
    }

    const habitsToCollapse: string[] = [];
    habitGroups.forEach(h => {
      const previouslyComplete = !!prevCompletions.current[h.key];
      if (h.allCompleted && !previouslyComplete) {
        habitsToCollapse.push(h.key);
      }
      prevCompletions.current[h.key] = h.allCompleted;
    });

    if (habitsToCollapse.length > 0) {
      setExpandedItems(prev => prev.filter(key => !habitsToCollapse.includes(key)));
    }
  }, [habitGroups]);

  const handleCapsuleComplete = (habit: any, capsule: any, actualValue: number, mood?: string) => {
    const totalEffectiveProgress = capsule.initialValue + actualValue;
    const isActuallyComplete = totalEffectiveProgress >= capsule.value;
    const spillover = Math.max(0, totalEffectiveProgress - capsule.value);

    if (isActuallyComplete) {
      completeCapsule.mutate({
        habitKey: habit.key,
        index: capsule.index,
        value: capsule.value,
        mood,
      });
    }

    logHabit({
      habitKey: habit.key,
      value: actualValue,
      taskName: `${habit.name} (${capsule.label}: ${actualValue} ${capsule.unit})`,
    });

    if (spillover > 0 && capsule.unit === 'min') {
      toast.success(`Bonus! +${Math.round(spillover)}m surplus applied to next part. 🎉`);
    }
  };

  const handleCapsuleUncomplete = (habit: any, capsule: any) => {
    uncompleteCapsule.mutate({
      habitKey: habit.key,
      index: capsule.index,
    });

    unlog({
      habitKey: habit.key,
      taskName: `${habit.name} (${capsule.label}: ${capsule.value} ${capsule.unit})`,
    });
  };

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  const workingOnHabit = data.habits.find(h => h.dailyProgress > 0 && !h.isComplete);

  const accordionBgMap: Record<HabitColor, string> = {
    orange: 'bg-orange-50/30 border-orange-100/50',
    blue: 'bg-blue-50/30 border-blue-100/50',
    green: 'bg-green-50/30 border-green-100/50',
    purple: 'bg-purple-50/30 border-purple-100/50',
    red: 'bg-red-50/30 border-red-100/50',
    indigo: 'bg-indigo-50/30 border-indigo-100/50',
  };

  const iconBgMap: Record<HabitColor, string> = {
    orange: 'bg-orange-100/80', blue: 'bg-blue-100/80', green: 'bg-green-100/80',
    purple: 'bg-purple-100/80', red: 'bg-red-100/80', indigo: 'bg-indigo-100/80',
  };

  const textTintMap: Record<HabitColor, string> = {
    orange: 'text-orange-700', blue: 'text-blue-700', green: 'text-green-700',
    purple: 'text-purple-700', red: 'text-red-700', indigo: 'text-indigo-700',
  };

  const renderHabitItem = (habit: any) => {
    const Icon = habitIconMap[habit.key] || Timer;
    const color = habitColorMap[habit.key] || 'blue';

    return (
      <AccordionItem
        key={habit.key}
        value={habit.key}
        className={cn(
          "border-2 bg-card rounded-2xl shadow-sm overflow-hidden transition-all",
          habit.allCompleted ? "opacity-80 grayscale-[0.3] border-transparent" : cn(accordionBgMap[color], "border-inherit")
        )}
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-4 text-left">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center relative shadow-sm", habit.allCompleted ? "bg-muted" : iconBgMap[color])}>
                <Icon className={cn("w-6 h-6", habit.allCompleted ? "text-muted-foreground" : textTintMap[color])} />
                {habit.is_fixed && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div>
                <h3 className={cn("font-bold text-lg flex items-center gap-2", !habit.allCompleted && textTintMap[color])}>
                  {habit.name}
                  {habit.allCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {habit.completedCapsulesCount}/{habit.totalCapsulesCount} {habit.totalCapsulesCount === 1 ? 'session' : 'parts'} done
                  {habit.is_fixed && " • Fixed goal"}
                </p>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2">
          <div className="grid grid-cols-1 gap-4">
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
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-lg mx-auto w-full px-4 py-6 pb-20">
        <HomeHeader
          dayCounter={data.daysActive}
          lastActiveText={data.lastActiveText}
          firstName={data.firstName}
          lastName={data.lastName}
          xp={data.xp}
          level={data.level}
        />

        <main className="space-y-8 mt-6">
          <TipCard
            tip={data.tip}
            bestTime={data.patterns.bestTime}
            workingOn={workingOnHabit?.name}
            isNeurodivergent={data.neurodivergentMode}
          />

          {/* Section 1: Anchor Practices - Now based on DB Category */}
          {anchorHabits.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkle className="w-5 h-5 text-primary fill-primary/20" />
                <h2 className="text-lg font-black uppercase tracking-widest text-primary/80">Anchor Practices</h2>
              </div>
              <div className="space-y-4">
                <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
                  {anchorHabits.map(renderHabitItem)}
                </Accordion>
              </div>
            </div>
          )}

          <Separator className="opacity-50" />

          {/* Section 2: Daily Momentum - Now based on DB Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Daily Momentum</h2>
              </div>

              <div className="bg-muted/60 p-1 rounded-xl flex gap-1 border border-border/50">
                <Button
                  variant={viewMode === 'capsules' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold"
                  onClick={() => setViewMode('capsules')}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Chunks
                </Button>
                <Button
                  variant={viewMode === 'overview' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold"
                  onClick={() => setViewMode('overview')}
                >
                  <ListTodo className="w-4 h-4 mr-1" />
                  Summary
                </Button>
              </div>
            </div>

            {viewMode === 'capsules' ? (
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
                {dailyHabits.map(renderHabitItem)}
              </Accordion>
            ) : (
              <div className="space-y-6">
                <LevelProgressCard currentXp={data.xp} currentLevel={data.level} />
                <TodaysProgressCard habits={data.habits} />
                <div className="space-y-4">
                  {data.habits.map(habit => {
                    const Icon = habitIconMap[habit.key];
                    return (
                      <HabitDetailCard
                        key={habit.key}
                        icon={Icon ? <Icon className="w-6 h-6" /> : null}
                        title={habit.name}
                        momentum={habit.momentum}
                        goal={`${habit.dailyGoal} ${habit.unit}`}
                        progressText={`${Math.round(habit.dailyProgress)}/${habit.dailyGoal}`}
                        progressValue={(habit.dailyProgress / habit.dailyGoal) * 100}
                        color={habitColorMap[habit.key]}
                        isComplete={habit.isComplete}
                        daysCompletedLast7Days={habit.daysCompletedLast7Days}
                        habitKey={habit.key}
                        dailyGoal={habit.dailyGoal}
                        onCheck={() => refetch()}
                        isFrozen={habit.is_frozen}
                        isFixed={habit.is_fixed}
                        neurodivergentMode={data.neurodivergentMode}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <MadeWithDyad className="mt-12" />
        </main>
      </div>
    </div>
  );
};

export default Index;