import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { QuickLogButton } from "@/components/dashboard/QuickLogButton";
import { BookOpen, Dumbbell, Music, Wind, AlertCircle } from "lucide-react";
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
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import React from "react"; // Import React for React.ElementType

const habitIconMap: { [key: string]: React.ElementType } = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
};

const quickLogVariantMap: { [key: string]: 'green' | 'purple' } = {
  pushups: 'green',
  meditation: 'purple',
  kinesiology: 'purple',
  piano: 'purple',
};

const habitDetailColorMap: { [key: string]: 'orange' | 'blue' } = {
  pushups: 'orange',
  meditation: 'blue',
  kinesiology: 'orange',
  piano: 'blue',
};

const Index = () => {
  const { data, isLoading, isError, refetch } = useDashboardData();

  if (isLoading) {
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

  const { daysActive, totalJourneyDays, daysToNextMonth, habits, weeklySummary, patterns, nextBadge, lastActiveText, firstName, reviewQuestion, tip } = data;

  const handleNextReviewQuestion = () => {
    refetch(); // Refetch dashboard data to get a new random question
  };

  return (
    <div className="flex flex-col bg-background">
      <div className="max-w-lg mx-auto w-full"> {/* New wrapper div for consistent width and centering */}
        <HomeHeader dayCounter={daysActive} lastActiveText={lastActiveText} firstName={firstName} />
        
        <main className="space-y-6"> {/* Removed p-4, now relies on Layout's padding */}
          
          <div className="grid grid-cols-2 gap-3">
            {habits.map(habit => {
              const Icon = habitIconMap[habit.key];
              const variant = quickLogVariantMap[habit.key];
              return (
                <QuickLogButton 
                  key={habit.key}
                  route={`/log/${habit.key}`}
                  state={{ duration: habit.dailyGoal }}
                  icon={Icon ? <Icon className="w-5 h-5" /> : null}
                  title={habit.name}
                  progress={`${habit.dailyProgress}/${habit.dailyGoal}${habit.unit}`}
                  variant={variant}
                  isComplete={habit.isComplete}
                />
              );
            })}
          </div>

          <DisciplineBanner />
          <TodaysProgressCard habits={habits} />
          <JourneyProgressCard daysActive={daysActive} totalJourneyDays={totalJourneyDays} daysToNextMonth={daysToNextMonth} />

          {habits.map(habit => {
            const Icon = habitIconMap[habit.key];
            const color = habitDetailColorMap[habit.key];
            return (
              <HabitDetailCard 
                key={habit.key}
                icon={Icon ? <Icon className="w-5 h-5" /> : null}
                title={habit.name}
                momentum={habit.momentum}
                goal={`Goal: ${habit.dailyGoal} ${habit.unit} today`}
                progressText={`${habit.dailyProgress}/${habit.dailyGoal}${habit.unit}`}
                progressValue={(habit.dailyProgress / habit.dailyGoal) * 100}
                color={color}
                isComplete={habit.isComplete}
                daysCompletedLast7Days={habit.daysCompletedLast7Days}
              />
            );
          })}

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
            totalPushups={habits.find(h => h.key === 'pushups')?.lifetimeProgress || 0}
            totalMeditation={habits.find(h => h.key === 'meditation')?.lifetimeProgress || 0}
          />
        </main>
        
        <MadeWithDyad /> {/* Moved inside the wrapper div */}
      </div>
    </div>
  );
};

export default Index;