import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Star, Flame, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useJourneyData } from '@/hooks/useJourneyData';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { JourneySkeleton } from '@/components/dashboard/JourneySkeleton'; // Import new skeleton

// Icon map for badges, similar to Settings page
const iconMap: { [key: string]: React.ElementType } = { Star, Flame };

const Journey = () => {
  const { data, isLoading, isError } = useJourneyData();

  if (isLoading) {
    return <JourneySkeleton />; // Using the new JourneySkeleton for loading
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Could not load Journey Data</h2>
        <p className="text-lg text-muted-foreground">There was an error fetching your progress. Please try again later.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  const { profile, habits, allBadges, achievedBadges, bestTime, totalJourneyDays } = data; // Destructure totalJourneyDays
  const achievedBadgeIds = new Set(achievedBadges.map(b => b.badge_id));

  const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
  const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  const dailyStreak = profile?.daily_streak || 0;

  // Logic to find the next badge, similar to useDashboardData
  const nextBadgeData = (allBadges || []).find(b => !achievedBadgeIds.has(b.id)) || null;
  let nextBadgeProgress = { progressValue: 0, value: 0, unit: '' };

  if (nextBadgeData) {
    const reqType = nextBadgeData.requirement_type;
    const reqValue = nextBadgeData.requirement_value;

    if (reqType === 'days_active') {
      const progress = Math.min((daysActive / (reqValue || 1)) * 100, 100);
      nextBadgeProgress = { progressValue: progress, value: Math.max(0, (reqValue || 0) - daysActive), unit: 'days left' };
    } else if (reqType === 'streak') {
      const progress = Math.min((dailyStreak / (reqValue || 1)) * 100, 100);
      nextBadgeProgress = { progressValue: progress, value: Math.max(0, (reqValue || 0) - dailyStreak), unit: 'days left' };
    } else if (reqType === 'lifetime_progress') {
      const habit = habits.find(h => h.habit_key === nextBadgeData.habit_key);
      if (habit) {
        const currentProgress = habit.lifetime_progress;
        const progress = Math.min((currentProgress / (reqValue || 1)) * 100, 100);
        const remaining = Math.max(0, (reqValue || 0) - currentProgress);
        const unit = habit.habit_key === 'meditation' ? 'min left' : `${habit.habit_key} left`;
        nextBadgeProgress = { progressValue: progress, value: remaining, unit: unit };
      }
    }
  }

  const NextBadgeIcon = nextBadgeData ? (iconMap[nextBadgeData.icon_name] || Star) : Star;

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-foreground text-center">Your Growth Journey</h1>
      <p className="text-center text-muted-foreground">Started on {format(startDate, 'PPP')} • Day {daysActive}</p>
      
      {/* Actionable Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Actionable Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
              Based on your activity, your most productive time is:
          </p>
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 rounded-md">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  {bestTime !== '—' ? `You're a ${bestTime} person! Try scheduling your most important tasks then.` : 'Log more tasks to discover your best time!'}
              </p>
          </div>
        </CardContent>
      </Card>

      {/* Badges and Gamification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
              <Trophy className="w-5 h-5 text-primary" />
              <span>Badges & Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextBadgeData ? (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center border border-yellow-300">
                  <NextBadgeIcon className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Badge</p>
                  <p className="font-semibold text-lg">{nextBadgeData.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={nextBadgeProgress.progressValue} className="h-2 flex-grow [&>div]:bg-yellow-500" />
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  <span className="font-semibold text-yellow-600">{nextBadgeProgress.value}</span> {nextBadgeProgress.unit}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">All badges unlocked! You are a true champion.</p>
          )}
          
          <Button variant="outline" className="w-full">
              Use Streak Freeze ({dailyStreak} days streak)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Journey;