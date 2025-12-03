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

const Index = () => {
  const { data, isLoading, isError, refetch } = useDashboardData(); // Added refetch

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
  const pushups = habits.find(h => h.key === 'pushups');
  const meditation = habits.find(h => h.key === 'meditation');
  const kinesiology = habits.find(h => h.key === 'kinesiology');
  const piano = habits.find(h => h.key === 'piano');

  const handleNextReviewQuestion = () => {
    refetch(); // Refetch dashboard data to get a new random question
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomeHeader dayCounter={daysActive} lastActiveText={lastActiveText} firstName={firstName} />
      
      <main className="flex-grow p-4 space-y-6 max-w-lg mx-auto w-full">
        
        <div className="grid grid-cols-2 gap-3">
          {pushups && <QuickLogButton 
            route="/log/pushups"
            icon={<Dumbbell className="w-5 h-5" />}
            title="complete!"
            progress={`${pushups.dailyProgress}/${pushups.dailyGoal}`}
            variant="green"
            isComplete={pushups.isComplete}
          />}
          {meditation && <QuickLogButton 
            route="/log/meditation"
            state={{ duration: meditation.dailyGoal }}
            icon={<Wind className="w-5 h-5" />}
            title={`min ${meditation.name}`}
            progress={`${meditation.dailyProgress}/${meditation.dailyGoal}`}
            variant="purple"
            isComplete={meditation.isComplete}
          />}
          {kinesiology && <QuickLogButton 
            route="/log/study"
            state={{ duration: kinesiology.dailyGoal }}
            icon={<BookOpen className="w-5 h-5" />}
            title={kinesiology.name}
            progress={`${kinesiology.dailyProgress}/${kinesiology.dailyGoal}m`}
            variant="purple"
            isComplete={kinesiology.isComplete}
          />}
          {piano && <QuickLogButton 
            route="/log/piano"
            state={{ duration: piano.dailyGoal }}
            icon={<Music className="w-5 h-5" />}
            title={piano.name}
            progress={`${piano.dailyProgress}/${piano.dailyGoal}m`}
            variant="purple"
            isComplete={piano.isComplete}
          />}
        </div>

        <DisciplineBanner />
        <TodaysProgressCard pushups={pushups} meditation={meditation} />
        <JourneyProgressCard daysActive={daysActive} totalJourneyDays={totalJourneyDays} daysToNextMonth={daysToNextMonth} />

        {pushups && <HabitDetailCard 
          icon={<Dumbbell className="w-5 h-5 text-habit-orange" />}
          title={pushups.name}
          momentum={pushups.momentum}
          goal={`Goal: ${pushups.dailyGoal} today`}
          progressText={`${pushups.dailyProgress}/${pushups.dailyGoal}`}
          progressValue={(pushups.dailyProgress / pushups.dailyGoal) * 100}
          color="orange"
          isComplete={pushups.isComplete}
          daysCompletedLast7Days={pushups.daysCompletedLast7Days}
        />}
        {meditation && <HabitDetailCard 
          icon={<Wind className="w-5 h-5 text-habit-blue" />}
          title={meditation.name}
          momentum={meditation.momentum}
          goal={`Goal: ${meditation.dailyGoal} min today`}
          progressText={`${meditation.dailyProgress}/${meditation.dailyGoal}`}
          progressValue={(meditation.dailyProgress / meditation.dailyGoal) * 100}
          color="blue"
          isComplete={meditation.isComplete}
          daysCompletedLast7Days={meditation.daysCompletedLast7Days}
        />}

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
          totalPushups={pushups?.lifetimeProgress || 0}
          totalMeditation={meditation?.lifetimeProgress || 0}
        />
      </main>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;