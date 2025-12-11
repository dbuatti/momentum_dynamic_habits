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
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home,
  projectwork: Code,
  teeth_brushing: Sparkles,
  medication: Pill,
};

// Define unique colors for each habit using custom Tailwind classes
const quickLogVariantMap: { [key: string]: 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'indigo' } = {
  pushups: 'orange',
  meditation: 'blue',
  kinesiology: 'green',
  piano: 'purple',
  housework: 'red',
  projectwork: 'indigo',
  teeth_brushing: 'blue',
  medication: 'purple',
};

const habitDetailColorMap: { [key: string]: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo' } = {
  pushups: 'orange',
  meditation: 'blue',
  kinesiology: 'green',
  piano: 'purple',
  housework: 'red',
  projectwork: 'indigo',
  teeth_brushing: 'blue',
  medication: 'purple',
};

// Define the order of habits to ensure new trackers appear at the top
const habitOrder = [
  'teeth_brushing',
  'medication',
  'pushups',
  'meditation',
  'kinesiology',
  'piano',
  'housework',
  'projectwork'
];

// Default habit configurations for new habits that might not be in the database yet
const defaultHabitConfigs = {
  teeth_brushing: {
    key: 'teeth_brushing',
    name: 'Brush Teeth',
    dailyGoal: 1,
    dailyProgress: 0,
    unit: 'session',
    momentum: 'Building',
    long_term_goal: 365,
    lifetimeProgress: 0,
    daysCompletedLast7Days: 0,
    isComplete: false
  },
  medication: {
    key: 'medication',
    name: 'Take Medication',
    dailyGoal: 1,
    dailyProgress: 0,
    unit: 'dose',
    momentum: 'Building',
    long_term_goal: 365,
    lifetimeProgress: 0,
    daysCompletedLast7Days: 0,
    isComplete: false
  }
};

const Index = () => {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { isLoading: isOnboardingLoading } = useOnboardingCheck();
  const [checkedHabits, setCheckedHabits] = useState<Set<string>>(new Set());

  const handleHabitCheck = (habitKey: string) => {
    setCheckedHabits(prev => new Set(prev).add(habitKey));
    // Refetch data after a short delay to allow for backend processing
    setTimeout(() => {
      refetch();
      setCheckedHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitKey);
        return newSet;
      });
    }, 1000);
  };

  if (isLoading || isOnboardingLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Could not load Dashboard</h2>
        <p className="text-muted-foreground">There was an error fetching your data. Please try again later.</p>
        <Link to="/login"><Button variant="outline" className="mt-4">Go to Login</Button></Link>
      </div>
    );
  }

  const { daysActive, totalJourneyDays, daysToNextMonth, habits, weeklySummary, patterns, nextBadge, lastActiveText, firstName, lastName, reviewQuestion, tip, xp, level, averageDailyTasks } = data;

  // Ensure new habits are always included, even if not in database
  const allHabits = [...habits];
  
  // Add default habits if they don't exist in the database
  Object.keys(defaultHabitConfigs).forEach(habitKey => {
    const exists = habits.some(h => h.key === habitKey);
    if (!exists) {
      allHabits.push(defaultHabitConfigs[habitKey]);
    }
  });

  // Sort habits according to the defined order
  const sortedHabits = [...allHabits].sort((a, b) => {
    const indexA = habitOrder.indexOf(a.key);
    const indexB = habitOrder.indexOf(b.key);
    
    // If both habits are in our order list, sort by their defined order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only A is in our order list, it comes first
    if (indexA !== -1) {
      return -1;
    }
    
    // If only B is in our order list, it comes first
    if (indexB !== -1) {
      return 1;
    }
    
    // If neither is in our order list, maintain original order
    return 0;
  });

  const handleNextReviewQuestion = () => {
    refetch(); // Refetch dashboard data to get a new random question
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <HomeHeader 
          dayCounter={daysActive} 
          lastActiveText={lastActiveText} 
          firstName={firstName} 
          lastName={lastName} 
          xp={xp} 
          level={level} 
        />
        <main className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {sortedHabits.map(habit => {
              const Icon = habitIconMap[habit.key];
              const variant = quickLogVariantMap[habit.key];
              return (
                <QuickLogButton
                  key={habit.key}
                  route={`/log/${habit.key === 'kinesiology' ? 'kinesiology' : habit.key.replace('_', '-')}`}
                  state={{ duration: habit.dailyGoal }}
                  icon={Icon ? <Icon className="w-5 h-5" /> : null}
                  title={habit.name}
                  progress={`${Math.round(habit.dailyProgress)}/${habit.dailyGoal} ${habit.unit}`}
                  variant={variant}
                  isComplete={habit.isComplete}
                  completedColorClass="bg-green-100 border-green-300 text-green-700"
                />
              );
            })}
          </div>
          <DisciplineBanner />
          <LevelProgressCard currentXp={xp} currentLevel={level} />
          <TodaysProgressCard habits={sortedHabits} />
          <JourneyProgressCard 
            daysActive={daysActive} 
            totalJourneyDays={totalJourneyDays} 
            daysToNextMonth={daysToNextMonth} 
          />
          <Separator className="my-2" />
          <div className="space-y-5">
            {sortedHabits.map(habit => {
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
                  goal={`Goal: ${habit.dailyGoal} ${habit.unit} today`}
                  progressText={`${Math.round(habit.dailyProgress)}/${habit.dailyGoal} ${habit.unit}`}
                  progressValue={(habit.dailyProgress / habit.dailyGoal) * 100}
                  color={color}
                  isComplete={isComplete}
                  daysCompletedLast7Days={habit.daysCompletedLast7Days}
                  habitKey={habit.key}
                  dailyGoal={habit.dailyGoal}
                  onCheck={() => handleHabitCheck(habit.key)}
                />
              );
            })}
          </div>
          {reviewQuestion && (
            <QuickReviewCard 
              question={reviewQuestion.question} 
              answer={reviewQuestion.answer} 
              onNext={handleNextReviewQuestion} 
            />
          )}
          {tip && <TipCard tip={tip} />}
          <WeeklySummaryCard summary={weeklySummary} />
          <PatternsCard patterns={patterns} />
          <NextBadgeCard badge={nextBadge} />
          <FooterStats 
            streak={patterns.streak} 
            daysActive={daysActive} 
            totalPushups={sortedHabits.find(h => h.key === 'pushups')?.lifetimeProgress || 0} 
            totalMeditation={sortedHabits.find(h => h.key === 'meditation')?.lifetimeProgress || 0} 
            averageDailyTasks={averageDailyTasks} 
          />
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;