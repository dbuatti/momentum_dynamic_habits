"use client";

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, PlusCircle, Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import HomeHeader from '@/components/HomeHeader';
import { QuickLogButton } from '@/components/dashboard/QuickLogButton';
import { LevelProgressCard } from '@/components/dashboard/LevelProgressCard';
import { TodayProgressCard } from '@/components/dashboard/TodayProgressCard';
import { JourneyProgressCard } from '@/components/dashboard/JourneyProgressCard';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';
import { PatternsCard } from '@/components/dashboard/PatternsCard';
import { NextBadgeCard } => '@/components/dashboard/NextBadgeCard';
import { TipCard } from '@/components/dashboard/TipCard';
import { DisciplineBanner } from '@/components/dashboard/DisciplineBanner';
import { GrowthGuide } from '@/components/dashboard/GrowthGuide';
import { FooterStats } from '@/components/dashboard/FooterStats';
import { format, addMonths, differenceInDays, startOfDay } from 'date-fns';
import { useJourneyData } from '@/hooks/useJourneyData';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils'; // Import from centralized utility

const Index = () => {
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError } = useDashboardData();
  const { data: journeyData, isLoading: isJourneyLoading, isError: isJourneyError } = useJourneyData();

  const isLoading = isDashboardLoading || isJourneyLoading;
  const isError = isDashboardError || isJourneyError;

  const today = new Date();

  // Calculate days to next month for JourneyProgressCard
  const daysToNextMonth = useMemo(() => {
    if (!dashboardData?.daysActive) return 0;
    const nextMonth = addMonths(startOfDay(today), 1);
    return differenceInDays(nextMonth, startOfDay(today));
  }, [dashboardData?.daysActive, today]);

  // Determine next badge for NextBadgeCard
  const nextBadge = useMemo(() => {
    if (!journeyData?.allBadges || !journeyData?.achievedBadges || !dashboardData) return null;

    const achievedBadgeIds = new Set(journeyData.achievedBadges.map(b => b.badge_id));
    const nextBadgeData = journeyData.allBadges.find(b => !achievedBadgeIds.has(b.id));

    if (!nextBadgeData) return null;

    const reqType = nextBadgeData.requirement_type;
    const reqValue = nextBadgeData.requirement_value || 1;
    
    let progressValue = 0;
    let value = 0;
    let unit = '';

    if (reqType === 'days_active') {
      progressValue = Math.min((dashboardData.daysActive / reqValue) * 100, 100);
      value = Math.max(0, reqValue - dashboardData.daysActive);
      unit = 'days left';
    } else if (reqType === 'streak') {
      progressValue = Math.min((dashboardData.patterns.streak / reqValue) * 100, 100);
      value = Math.max(0, reqValue - dashboardData.patterns.streak);
      unit = 'days left';
    } else if (reqType === 'lifetime_progress') {
      const habit = dashboardData.habits.find(h => h.habit_key === nextBadgeData.habit_key);
      if (habit) {
        const currentProgressRaw = habit.raw_lifetime_progress; 
        progressValue = Math.min((currentProgressRaw / reqValue) * 100, 100);
        
        const remainingRaw = Math.max(0, reqValue - currentProgressRaw);
        let remainingUIValue = remainingRaw;
        
        if (habit.unit === 'min') {
            remainingUIValue = Math.ceil(remainingRaw / 60);
            unit = 'min left';
        } else {
            unit = `${habit.unit} left`;
        }
        value = remainingUIValue;
      }
    }

    return {
      name: nextBadgeData.name,
      icon_name: nextBadgeData.icon_name,
      progress: { progressValue, value, unit },
    };
  }, [journeyData, dashboardData]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !dashboardData || !journeyData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Could not load Dashboard</h2>
        <p className="text-lg text-muted-foreground">There was an error fetching your data. Please try again later.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Reload Page</Button></Link>
      </div>
    );
  }

  const {
    daysActive,
    totalJourneyDays,
    habits,
    neurodivergentMode,
    weeklySummary,
    patterns,
    lastActiveText,
    firstName,
    lastName,
    xp,
    level,
    tip,
    averageDailyTasks,
  } = dashboardData;

  // Filter habits for QuickLogButtons: only show non-fixed, non-trial, non-anchor, and not completed
  const quickLogHabits = habits.filter(h => 
    !h.is_fixed && 
    !h.is_trial_mode && 
    !h.anchor_practice && 
    !h.isComplete &&
    !h.isLockedByDependency && // Don't show if locked by dependency
    h.isScheduledForToday && // Only show if scheduled for today
    h.isWithinWindow // Only show if within time window
  ).slice(0, 4); // Limit to 4 for quick log

  // Determine total pushups and meditation from lifetime progress
  const totalPushups = habits.find(h => h.habit_key === 'pushups')?.lifetime_progress || 0;
  const totalMeditation = habits.find(h => h.habit_key === 'meditation')?.lifetime_progress || 0;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-8 pb-32">
      <HomeHeader
        dayCounter={daysActive}
        lastActiveText={lastActiveText}
        firstName={firstName}
        lastName={lastName}
        xp={xp}
        level={level}
      />

      {/* Quick Log Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {quickLogHabits.length > 0 ? (
          quickLogHabits.map((habit) => {
            const Icon = habitIconMap[habit.key] || habitIconMap.custom_habit;
            const colorVariant = habitColorMap[habit.key] || 'indigo';
            return (
              <QuickLogButton
                key={habit.id}
                icon={<Icon className="w-5 h-5" />}
                title={habit.name}
                progress={`${Math.round(habit.dailyProgress)}/${Math.round(habit.adjustedDailyGoal)} ${habit.unit}`}
                isComplete={habit.isComplete}
                variant={colorVariant}
                route={`/log/${habit.key}`} // Example route, adjust as needed
                habitKey={habit.key}
              />
            );
          })
        ) : (
          <Link to="/create-habit" className="col-span-2">
            <Button className="w-full h-24 rounded-2xl text-lg font-bold">
              <PlusCircle className="w-6 h-6 mr-2" />
              Add Your First Habit
            </Button>
          </Link>
        )}
      </div>

      <LevelProgressCard currentXp={xp} currentLevel={level} />

      <TodayProgressCard habits={habits} neurodivergentMode={neurodivergentMode} isLoading={isDashboardLoading} />

      <JourneyProgressCard
        daysActive={daysActive}
        totalJourneyDays={totalJourneyDays}
        daysToNextMonth={daysToNextMonth}
      />

      <WeeklySummaryCard summary={weeklySummary} />

      <PatternsCard patterns={patterns} />

      <NextBadgeCard badge={nextBadge} />

      <TipCard 
        tip={tip} 
        bestTime={patterns.bestTime} 
        workingOn={habits.find(h => !h.isComplete && h.isScheduledForToday)?.name} 
        isNeurodivergent={neurodivergentMode}
      />

      <DisciplineBanner />
      
      <GrowthGuide />

      <FooterStats
        streak={patterns.streak}
        daysActive={daysActive}
        totalPushups={totalPushups}
        totalMeditation={totalMeditation}
        averageDailyTasks={averageDailyTasks}
      />
    </div>
  );
};

export default Index;