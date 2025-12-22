import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { QuickLogButton } from "@/components/dashboard/QuickLogButton";
import { BookOpen, Dumbbell, Music, Wind, AlertCircle, Home, Code, Sparkles, Pill } from "lucide-react";
import { DisciplineBanner } from "@/components/dashboard/DisciplineBanner";
import { TodaysProgressCard } from "@/components/dashboard/TodaysProgressCard";
import { JourneyProgressCard } from "@/components/dashboard/JourneyProgressCard";
import { HabitDetailCard } from "@/components/dashboard/HabitDetailCard";
import { QuickReviewCard } from "@/components/dashboard/QuickReviewCard";
import { TipCard } from "@/components/dashboard/TipCard";
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard";
import { PatternsCard } from "@/components/dashboard/PatternsCard";
import { NextBadgeCard } from "@/components/dashboard/NextBadgeCard";
import { FooterStats } from "@/components/dashboard/FooterStats";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { Separator } from "@/components/ui/separator";

const habitIconMap: { [key: string]: React.ElementType } = {
  pushups: Dumbbell, meditation: Wind, kinesiology: BookOpen, piano: Music, housework: Home, projectwork: Code, teeth_brushing: Sparkles, medication: Pill,
};

const habitDetailColorMap: { [key: string]: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo' } = {
  pushups: 'orange', meditation: 'blue', kinesiology: 'green', piano: 'purple', housework: 'red', projectwork: 'indigo', teeth_brushing: 'blue', medication: 'purple',
};

const Index = () => {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const [checkedHabits, setCheckedHabits] = useState<Set<string>>(new Set());

  const handleHabitCheck = (habitKey: string) => {
    setCheckedHabits(prev => new Set(prev).add(habitKey));
    setTimeout(() => {
      refetch();
      setCheckedHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitKey);
        return newSet;
      });
    }, 1000);
  };

  if (isLoading || isOnboardingLoading) return <DashboardSkeleton />;
  if (isError || !data) return null;

  const { habits, daysActive, totalJourneyDays, daysToNextMonth, weeklySummary, patterns, nextBadge, lastActiveText, firstName, lastName, reviewQuestion, tip, xp, level, averageDailyTasks } = data;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <HomeHeader dayCounter={daysActive} lastActiveText={lastActiveText} firstName={firstName} lastName={lastName} xp={xp} level={level} />
        
        <main className="space-y-6">
          <DisciplineBanner />
          <LevelProgressCard currentXp={xp} currentLevel={level} />
          <TodaysProgressCard habits={habits} />
          
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Habit Plateaus</h3>
            {habits.map(habit => {
              const Icon = habitIconMap[habit.key];
              const color = habitDetailColorMap[habit.key];
              const isTemporarilyChecked = checkedHabits.has(habit.key);
              const isComplete = isTemporarilyChecked || habit.isComplete;
              return (
                <HabitDetailCard
                  key={habit.key}
                  icon={Icon ? <Icon className="w-5 h-5" /> : null}
                  title={habit.name}
                  momentum={habit.momentum}
                  goal={`Current Goal: ${habit.dailyGoal} ${habit.unit}`}
                  progressText={`${Math.round(habit.dailyProgress)}/${habit.dailyGoal} ${habit.unit}`}
                  progressValue={(habit.dailyProgress / habit.dailyGoal) * 100}
                  color={color}
                  isComplete={isComplete}
                  daysCompletedLast7Days={habit.daysCompletedLast7Days}
                  habitKey={habit.key}
                  dailyGoal={habit.dailyGoal}
                  onCheck={() => handleHabitCheck(habit.key)}
                  isFrozen={habit.is_frozen}
                />
              );
            })}
          </div>

          <JourneyProgressCard daysActive={daysActive} totalJourneyDays={totalJourneyDays} daysToNextMonth={daysToNextMonth} />
          <WeeklySummaryCard summary={weeklySummary} />
          <PatternsCard patterns={patterns} />
          <NextBadgeCard badge={nextBadge} />
          <FooterStats streak={patterns.streak} daysActive={daysActive} totalPushups={habits.find(h => h.key === 'pushups')?.lifetimeProgress || 0} totalMeditation={habits.find(h => h.key === 'meditation')?.lifetimeProgress || 0} averageDailyTasks={averageDailyTasks} />
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;