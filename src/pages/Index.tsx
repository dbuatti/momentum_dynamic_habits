import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import { differenceInDays, startOfDay, subDays } from 'date-fns';
import { QuickLogButton } from "@/components/dashboard/QuickLogButton";
import { BookOpen, Dumbbell, Music, Wind } from "lucide-react";
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

const Index = () => {
  const today = startOfDay(new Date());
  const startDate = subDays(today, 6); // Start the count 6 days ago to make today Day 7
  const dayCounter = differenceInDays(today, startDate) + 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomeHeader dayCounter={dayCounter} />
      
      <main className="flex-grow p-4 space-y-6 max-w-lg mx-auto w-full">
        
        <div className="grid grid-cols-2 gap-3">
          <QuickLogButton 
            icon={<Dumbbell className="w-5 h-5" />}
            title="complete!"
            progress="17/8"
            variant="green"
            isComplete
          />
          <QuickLogButton 
            icon={<Wind className="w-5 h-5" />}
            title="min breathe"
            progress="2/4"
            variant="purple"
          />
          <QuickLogButton 
            icon={<BookOpen className="w-5 h-5" />}
            title="kinesiology"
            progress="0s/1m"
            variant="purple"
          />
          <QuickLogButton 
            icon={<Music className="w-5 h-5" />}
            title="Blues pno"
            progress="0s/30s"
            variant="purple"
          />
        </div>

        <DisciplineBanner />
        <TodaysProgressCard />
        <JourneyProgressCard />

        <HabitDetailCard 
          icon={<Dumbbell className="w-5 h-5 text-habit-orange" />}
          title="Push-ups"
          momentum="building"
          goal="Goal: 8 today"
          progressText="17/8"
          progressValue={100}
          color="orange"
          isComplete={true}
        />
        <HabitDetailCard 
          icon={<Wind className="w-5 h-5 text-habit-blue" />}
          title="Meditation"
          momentum="crushing it"
          goal="Goal: 4 min today"
          progressText="2/4"
          progressValue={50}
          color="blue"
          isComplete={false}
        />

        <QuickReviewCard />
        <TipCard />
        <WeeklySummaryCard />
        <PatternsCard />
        <NextBadgeCard />
        <FooterStats />
      </main>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;