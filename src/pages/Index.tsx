"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { 
  BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, 
  CheckCircle2, Timer, Target, Anchor, TrendingUp, ShieldCheck, 
  Zap, Layers, AlertCircle, Clock
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { HabitCapsule } from "@/components/dashboard/HabitCapsule";
import { useCapsules } from "@/hooks/useCapsules";
import { useHabitLog } from "@/hooks/useHabitLog";
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
  pushups: Dumbbell, meditation: Wind, kinesiology: BookOpen, piano: Music,
  housework: Home, projectwork: Code, teeth_brushing: Sparkles, medication: Pill,
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

  // Memoized habit grouping with built-in chunking logic
  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];

    return data.habits
      .filter(habit => habit.is_visible)
      .map(habit => {
        const goal = habit.dailyGoal;
        const progress = habit.dailyProgress;
        
        const { numChunks, chunkValue } = calculateDynamicChunks(
          habit.key, goal, habit.unit, data.neurodivergentMode,
          habit.auto_chunking, habit.num_chunks, habit.chunk_duration
        );

        const capsules = Array.from({ length: numChunks }).map((_, i) => {
          const dbCapsule = dbCapsules?.find(c => c.habit_key === habit.key && c.capsule_index === i);
          const threshold = (i + 1) * chunkValue;
          const isCompleted = dbCapsule?.is_completed || progress >= (i === numChunks - 1 ? goal : threshold);

          return {
            id: `${habit.key}-${i}`,
            habitKey: habit.key,
            index: i,
            label: habit.auto_chunking ? `Part ${i + 1}` : (habit.is_trial_mode ? 'Entry Session' : `Milestone ${i + 1}`),
            value: chunkValue,
            initialValue: Math.max(0, Math.min(chunkValue, progress - (i * chunkValue))),
            unit: habit.unit,
            isCompleted,
            scheduledTime: dbCapsule?.scheduled_time,
          };
        });

        return { ...habit, capsules, allCompleted: progress >= goal, numChunks };
      });
  }, [data?.habits, dbCapsules, data?.neurodivergentMode]);

  const anchorHabits = useMemo(() => habitGroups.filter(h => h.category === 'anchor'), [habitGroups]);
  const dailyHabits = useMemo(() => 
    habitGroups.filter(h => h.category === 'daily')
    .sort((a, b) => (a.allCompleted === b.allCompleted ? 0 : a.allCompleted ? 1 : -1))
  , [habitGroups]);

  // Auto-expand logically: Open habits that are ready now and not finished
  useEffect(() => {
    if (habitGroups.length > 0 && expandedItems.length === 0) {
      const urgent = habitGroups.filter(h => !h.allCompleted && h.isWithinWindow).map(h => h.key);
      setExpandedItems(urgent);
    }
  }, [habitGroups]);

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  const renderHabitItem = (habit: any) => {
    const Icon = habitIconMap[habit.key] || Timer;
    const color = habitColorMap[habit.key] || 'blue';
    const isGrowth = !habit.is_fixed && !habit.is_trial_mode;
    const isTrial = habit.is_trial_mode;
    const isRestricted = !habit.isWithinWindow && !habit.allCompleted;

    const nextCapsule = habit.capsules.find((c: any) => !c.isCompleted);
    const showOnlyNext = !showAllMomentum[habit.key] && habit.numChunks > 1;

    return (
      <AccordionItem
        key={habit.key}
        value={habit.key}
        className={cn(
          "border-2 rounded-[32px] overflow-hidden transition-all duration-500",
          habit.allCompleted 
            ? "opacity-60 bg-muted/20 border-transparent scale-[0.98]" 
            : isRestricted 
              ? "bg-slate-50 border-slate-200 opacity-80"
              : "bg-card border-black/5 shadow-lg shadow-black/[0.03] scale-[1]"
        )}
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline group">
          <div className="flex flex-col w-full text-left gap-4">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110",
                    habit.allCompleted ? "bg-white text-muted-foreground" : "bg-primary text-primary-foreground shadow-sm"
                  )}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-xl flex items-center gap-2 tracking-tight">
                      {habit.name}
                      {habit.allCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {isRestricted ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Waiting for window
                        </span>
                      ) : (
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full",
                          habit.allCompleted ? "bg-green-50 text-green-600 border border-green-200" : "bg-primary/10 text-primary"
                        )}>
                          {habit.allCompleted ? "Target Met" : "Active Session"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black tabular-nums">{habit.dailyProgress}<span className="text-muted-foreground/40 font-bold text-sm">/{habit.dailyGoal}</span></p>
                    <p className="text-[9px] font-black uppercase opacity-40 tracking-tighter">{habit.unit}</p>
                </div>
            </div>

            <div className="w-full">
              <MacroGoalProgress 
                current={habit.weekly_completions} 
                total={habit.frequency_per_week} 
                label={isTrial ? "Trial Progress" : "Weekly Consistency"}
              />
            </div>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="px-6 pb-6 pt-2 space-y-5">
          {/* Growth & Trial Contextual Cards */}
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

          {isGrowth && !habit.allCompleted && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Stability Level</p>
                    </div>
                    <span className="text-[10px] font-black text-primary">{habit.growth_stats.completions}/{habit.growth_stats.required} Days</span>
                </div>
                <Progress value={(habit.growth_stats.completions / habit.growth_stats.required) * 100} className="h-1.5" />
                <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                    {habit.growth_stats.daysRemaining} days of consistency until system scales your {habit.growth_stats.phase}.
                </p>
            </div>
          )}

          {/* Habit Capsules Container */}
          <div className="grid gap-3">
            {showOnlyNext && nextCapsule ? (
              <>
                <HabitCapsule
                  key={nextCapsule.id}
                  {...nextCapsule}
                  habitName={habit.name}
                  color={color}
                  onComplete={(actual, mood) => {
                    logHabit({ habitKey: habit.key, value: actual, taskName: `${habit.name} session` });
                    completeCapsule.mutate({ habitKey: habit.key, index: nextCapsule.index, value: actual, mood });
                  }}
                  onUncomplete={() => {
                    uncompleteCapsule.mutate({ habitKey: habit.key, index: nextCapsule.index });
                    unlog({ habitKey: habit.key, taskName: `${habit.name} session` });
                  }}
                  showMood={data.neurodivergentMode}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-[10px] font-black uppercase tracking-widest h-10 rounded-xl border-dashed border-2 hover:bg-primary/5"
                  onClick={() => setShowAllMomentum(prev => ({ ...prev, [habit.key]: true }))}
                >
                  <Layers className="w-3.5 h-3.5 mr-2" />
                  Expand All Parts ({habit.numChunks})
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
                    onComplete={(actual, mood) => {
                        logHabit({ habitKey: habit.key, value: actual, taskName: `${habit.name} session` });
                        completeCapsule.mutate({ habitKey: habit.key, index: capsule.index, value: actual, mood });
                    }}
                    onUncomplete={() => {
                        uncompleteCapsule.mutate({ habitKey: habit.key, index: capsule.index });
                        unlog({ habitKey: habit.key, taskName: `${habit.name} session` });
                    }}
                    showMood={data.neurodivergentMode}
                  />
                ))}
                {habit.numChunks > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-[9px] font-black uppercase opacity-40 hover:opacity-100"
                    onClick={() => setShowAllMomentum(prev => ({ ...prev, [habit.key]: false }))}
                  >
                    Minimize (Show Next Only)
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
    <div className="flex flex-col min-h-screen bg-[#fafafa]">
      <div className="max-w-lg mx-auto w-full px-4 py-8 pb-32">
        <HomeHeader
            dayCounter={data.daysActive}
            lastActiveText={data.lastActiveText}
            firstName={data.firstName}
            lastName={data.lastName}
            xp={data.xp}
            level={data.level}
        />

        <main className="mt-8 space-y-10">
          <TipCard tip={data.tip} bestTime={data.patterns.bestTime} isNeurodivergent={data.neurodivergentMode} />

          {/* Anchor Practices Section */}
          {anchorHabits.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-black/[0.03] pb-2">
                <Anchor className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary/80">Anchor Practices</h2>
              </div>
              <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-5">
                {anchorHabits.map(renderHabitItem)}
              </Accordion>
            </section>
          )}

          {/* Daily Momentum Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-black/[0.03] pb-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Momentum</h2>
            </div>
            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-5">
              {dailyHabits.map(renderHabitItem)}
            </Accordion>
          </section>

          <GrowthGuide />
          <MadeWithDyad className="mt-16 opacity-50 hover:opacity-100 transition-opacity" />
        </main>
      </div>
    </div>
  );
};

export default Index;