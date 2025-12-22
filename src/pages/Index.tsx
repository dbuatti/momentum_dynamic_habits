import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { BookOpen, Dumbbell, Music, Wind, Home, Code, Sparkles, Pill, LayoutGrid, ListTodo, Plus, ChevronRight, Zap, Info } from "lucide-react";
import { DisciplineBanner } from "@/components/dashboard/DisciplineBanner";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { TipCard } from "@/components/dashboard/TipCard";

const habitIconMap: { [key: string]: React.ElementType } = {
  pushups: Dumbbell, meditation: Wind, kinesiology: BookOpen, piano: Music, housework: Home, projectwork: Code, teeth_brushing: Sparkles, medication: Pill,
};

const habitColorMap: { [key: string]: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo' } = {
  pushups: 'orange', meditation: 'blue', kinesiology: 'green', piano: 'purple', housework: 'red', projectwork: 'indigo', teeth_brushing: 'blue', medication: 'purple',
};

const Index = () => {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { dbCapsules, isLoading: isCapsulesLoading, completeCapsule } = useCapsules();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const { mutate: logHabit } = useHabitLog();
  
  const [viewMode, setViewMode] = useState<'capsules' | 'overview'>('capsules');

  const habitGroups = useMemo(() => {
    if (!data?.habits) return [];
    
    return data.habits.map(habit => {
      const goal = habit.dailyGoal;
      const progress = habit.dailyProgress;
      
      let numCapsules = 1;
      let capsuleValue = goal;
      
      if (habit.key === 'pushups') {
        numCapsules = Math.max(1, Math.ceil(goal / 5));
        capsuleValue = 5;
      } else if (habit.unit === 'min') {
        if (goal >= 60) { numCapsules = 4; capsuleValue = Math.ceil(goal / 4); }
        else if (goal >= 30) { numCapsules = 3; capsuleValue = Math.ceil(goal / 3); }
        else if (goal >= 15) { numCapsules = 2; capsuleValue = Math.ceil(goal / 2); }
      }

      const capsules = Array.from({ length: numCapsules }).map((_, i) => {
        const dbCapsule = dbCapsules?.find(c => c.habit_key === habit.key && c.capsule_index === i);
        const isCompleted = dbCapsule?.is_completed || progress >= (i + 1) * capsuleValue;
        
        return {
          id: `${habit.key}-${i}`,
          habitKey: habit.key,
          index: i,
          label: `${habit.name} Chunk ${i + 1}`,
          value: i === numCapsules - 1 ? goal - (capsuleValue * (numCapsules - 1)) : capsuleValue,
          isCompleted,
          scheduledTime: dbCapsule?.scheduled_time,
        };
      });

      return { ...habit, capsules, allCompleted: capsules.every(c => c.isCompleted) };
    });
  }, [data?.habits, dbCapsules]);

  const handleCapsuleComplete = (habit: any, capsule: any, mood?: string) => {
    completeCapsule.mutate({ habitKey: habit.key, index: capsule.index, mood });
    logHabit({
      habitKey: habit.key,
      value: capsule.value,
      taskName: `${habit.name} (Modular Chunk)`
    });
  };

  if (isLoading || isOnboardingLoading || isCapsulesLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <HomeHeader dayCounter={data.daysActive} lastActiveText={data.lastActiveText} firstName={data.firstName} lastName={data.lastName} xp={data.xp} level={data.level} />
        
        <main className="space-y-6">
          <TipCard tip={data.tip} bestTime={data.patterns.bestTime} isNeurodivergent={data.neurodivergentMode} />

          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              Your Daily Chunks
            </h2>
            <div className="bg-muted p-1 rounded-lg flex gap-1">
              <Button 
                variant={viewMode === 'capsules' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => setViewMode('capsules')}
              >
                <LayoutGrid className="w-3 h-3 mr-1" /> Capsules
              </Button>
              <Button 
                variant={viewMode === 'overview' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => setViewMode('overview')}
              >
                <Zap className="w-3 h-3 mr-1" /> Overview
              </Button>
            </div>
          </div>

          {viewMode === 'capsules' ? (
            <div className="space-y-6">
              <Accordion type="multiple" defaultValue={habitGroups.map(h => h.key)} className="space-y-4">
                {habitGroups.map(habit => {
                  const Icon = habitIconMap[habit.key];
                  const color = habitColorMap[habit.key];
                  
                  return (
                    <AccordionItem key={habit.key} value={habit.key} className="border-none bg-card rounded-2xl shadow-sm overflow-hidden">
                      <AccordionTrigger className="px-5 py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center relative", `bg-${color}-100`)}>
                            {Icon && <Icon className={cn("w-5 h-5", `text-${color}-500`)} />}
                            {habit.is_fixed && (
                              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-white">
                                <Lock className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-base leading-none flex items-center gap-2">
                              {habit.name}
                              {habit.is_fixed && <Lock className="w-3 h-3 text-muted-foreground" />}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                              {habit.capsules.filter(c => c.isCompleted).length}/{habit.capsules.length} chunks done
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5">
                        <div className="grid grid-cols-1 gap-3">
                          {habit.capsules.map(capsule => (
                            <HabitCapsule
                              key={capsule.id}
                              {...capsule}
                              unit={habit.unit}
                              color={color}
                              onComplete={(mood) => handleCapsuleComplete(habit, capsule, mood)}
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
                      icon={Icon ? <Icon className="w-5 h-5" /> : null}
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

          <Separator className="my-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <JourneyProgressCard daysActive={data.daysActive} totalJourneyDays={data.totalJourneyDays} daysToNextMonth={data.daysToNextMonth} />
            <WeeklySummaryCard summary={data.weeklySummary} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PatternsCard patterns={data.patterns} />
            <NextBadgeCard badge={data.nextBadge} />
          </div>

          <FooterStats 
            streak={data.patterns.streak} 
            daysActive={data.daysActive} 
            totalPushups={data.habits.find(h => h.key === 'pushups')?.lifetimeProgress || 0} 
            totalMeditation={data.habits.find(h => h.key === 'meditation')?.lifetimeProgress || 0} 
            averageDailyTasks={data.averageDailyTasks} 
          />
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;