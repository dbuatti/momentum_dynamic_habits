"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, LayoutGrid, ListTodo, Zap, Lock, CheckCircle2, Timer } from "lucide-react";
import { TodaysProgressCard } from "@/components/dashboard/TodaysProgressCard";
import { JourneyProgressCard } from "@/components/dashboard/JourneyProgressCard";
import { HabitDetailCard } from "@/components/dashboard/HabitDetailCard";
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard";
import { PatternsCard } from "@/components/dashboard/PatternsCard";
import { NextBadgeCard } from "@/components/dashboard/NextBadgeCard";
import { FooterStats } from "@/components/dashboard/FooterStats";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { HabitCapsule } from "@/components/dashboard/HabitCapsule";
import { useCapsules } from "@/hooks/useCapsules";
import { useHabitLog } from "@/hooks/useHabitLog";
import React, { useState, useMemo } from "react";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { TipCard } from "@/components/dashboard/TipCard";

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

  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];

    const groups = data.habits.map(habit => {
      const goal = habit.dailyGoal;
      const progress = habit.dailyProgress;
      const isReps = habit.unit === 'reps';
      const isMinutes = habit.unit === 'min';

      let numCapsules = 1;
      let capsuleValue = goal;

      if (habit.key === 'pushups' && isReps) {
        const idealSetSize = Math.min(7, Math.max(5, Math.ceil(goal / 4)));
        numCapsules = Math.ceil(goal / idealSetSize);
        capsuleValue = idealSetSize;
      } else if (isMinutes) {
        if (goal >= 60) {
          numCapsules = 4;
          capsuleValue = 15;
        } else if (goal >= 45) {
          numCapsules = 3;
          capsuleValue = Math.ceil(goal / 3);
        } else if (goal >= 20) {
          numCapsules = 2;
          capsuleValue = Math.ceil(goal / 2);
        } else if (goal >= 10) {
          numCapsules = 2;
          capsuleValue = Math.ceil(goal / 2);
        }
      }

      const capsules = Array.from({ length: numCapsules }).map((_, i) => {
        const dbCapsule = dbCapsules?.find(c => c.habit_key === habit.key && c.capsule_index === i);
        const cumulativeNeeded = (i + 1) * capsuleValue;
        const lastCapsuleAdjustment = i === numCapsules - 1 ? goal - capsuleValue * (numCapsules - 1) : capsuleValue;
        const value = lastCapsuleAdjustment > 0 ? lastCapsuleAdjustment : capsuleValue;

        const isCompleted = dbCapsule?.is_completed || progress >= cumulativeNeeded || (i === numCapsules - 1 && progress >= goal);

        return {
          id: `${habit.key}-${i}`,
          habitKey: habit.key,
          index: i,
          label: habit.key === 'pushups' ? `Set ${i + 1}` : `Part ${i + 1}`,
          value,
          unit: habit.unit,
          isCompleted,
          scheduledTime: dbCapsule?.scheduled_time,
        };
      });

      const allCompleted = capsules.every(c => c.isCompleted) || progress >= goal;

      return {
        ...habit,
        capsules,
        allCompleted,
        completedCapsulesCount: capsules.filter(c => c.isCompleted).length,
        totalCapsulesCount: numCapsules,
      };
    });

    return [...groups].sort((a, b) => {
      if (a.allCompleted && !b.allCompleted) return 1;
      if (!a.allCompleted && b.allCompleted) return -1;
      return 0;
    });
  }, [data?.habits, dbCapsules]);

  const handleCapsuleComplete = (habit: any, capsule: any, mood?: string) => {
    completeCapsule.mutate({
      habitKey: habit.key,
      index: capsule.index,
      value: capsule.value,
      mood,
    });

    logHabit({
      habitKey: habit.key,
      value: capsule.value,
      taskName: `${habit.name} (${capsule.label}: ${capsule.value} ${capsule.unit})`,
    });
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

        <main className="space-y-6 mt-6">
          <TipCard
            tip={data.tip}
            bestTime={data.patterns.bestTime}
            workingOn={workingOnHabit?.name}
            isNeurodivergent={data.neurodivergentMode}
          />

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              Your Daily Chunks
            </h2>

            <div className="bg-muted/60 p-1 rounded-xl flex gap-1 border border-border/50">
              <Button
                variant={viewMode === 'capsules' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-4 text-xs font-semibold"
                onClick={() => setViewMode('capsules')}
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                Capsules
              </Button>
              <Button
                variant={viewMode === 'overview' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-4 text-xs font-semibold"
                onClick={() => setViewMode('overview')}
              >
                <Zap className="w-4 h-4 mr-1" />
                Overview
              </Button>
            </div>
          </div>

          {viewMode === 'capsules' ? (
            <div className="space-y-5">
              <Accordion type="multiple" defaultValue={habitGroups.filter(h => !h.allCompleted).map(h => h.key)} className="space-y-4">
                {habitGroups.map(habit => {
                  const Icon = habitIconMap[habit.key] || Timer;
                  const color = habitColorMap[habit.key] || 'blue';

                  return (
                    <AccordionItem
                      key={habit.key}
                      value={habit.key}
                      className={cn(
                        "border-none bg-card rounded-2xl shadow-md overflow-hidden ring-1 ring-border/50 transition-all",
                        habit.allCompleted && "opacity-80"
                      )}
                    >
                      <AccordionTrigger className="px-6 py-5 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-4 text-left">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center relative", `bg-${color}-100/80`)}>
                              <Icon className={cn("w-6 h-6", `text-${color}-600`)} />
                              {habit.is_fixed && (
                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                  <Lock className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                {habit.name}
                                {habit.allCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                              </h3>
                              <p className="text-sm text-muted-foreground font-medium">
                                {habit.completedCapsulesCount}/{habit.totalCapsulesCount} parts done
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
                              color={color}
                              onComplete={(mood) => handleCapsuleComplete(habit, capsule, mood)}
                              onUncomplete={() => handleCapsuleUncomplete(habit, capsule)}
                              showMood={data.neurodivergentMode}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
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

          <MadeWithDyad className="mt-12" />
        </main>
      </div>
    </div>
  );
};

export default Index;