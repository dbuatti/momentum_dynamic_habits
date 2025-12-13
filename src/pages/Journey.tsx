import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Star, Flame, AlertCircle, Target, Calendar, Zap, Dumbbell, Wind, Shield, Crown, Mountain } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useJourneyData } from '@/hooks/useJourneyData';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { JourneySkeleton } from '@/components/dashboard/JourneySkeleton';
import { PageHeader } from '@/components/layout/PageHeader';

// Icon map for badges, matching NextBadgeCard and Settings
const iconMap: { [key: string]: React.ElementType } = {
  Star,
  Flame,
  Trophy,
  Dumbbell,
  Wind,
  Shield,
  Crown,
  Mountain,
};

const Journey = () => {
  const { data, isLoading, isError } = useJourneyData();

  if (isLoading) {
    return <JourneySkeleton />;
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

  const { profile, habits, allBadges, achievedBadges, bestTime, totalJourneyDays } = data;
  
  const achievedBadgeIds = new Set(achievedBadges.map(b => b.badge_id));
  const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
  const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  const dailyStreak = profile?.daily_streak || 0;

  // Logic to find the next badge
  const nextBadgeData = (allBadges || []).find(b => !achievedBadgeIds.has(b.id)) || null;
  
  let nextBadgeProgress = { progressValue: 0, value: 0, unit: '' };
  
  if (nextBadgeData) {
    const reqType = nextBadgeData.requirement_type;
    const reqValue = nextBadgeData.requirement_value || 1;
    
    if (reqType === 'days_active') {
      const progress = Math.min((daysActive / reqValue) * 100, 100);
      nextBadgeProgress = {
        progressValue: progress,
        value: Math.max(0, reqValue - daysActive),
        unit: 'days left'
      };
    } else if (reqType === 'streak') {
      const progress = Math.min((dailyStreak / reqValue) * 100, 100);
      nextBadgeProgress = {
        progressValue: progress,
        value: Math.max(0, reqValue - dailyStreak),
        unit: 'days left'
      };
    } else if (reqType === 'lifetime_progress') {
      const habit = habits.find(h => h.habit_key === nextBadgeData.habit_key);
      if (habit) {
        // Use raw progress (seconds/reps) against DB requirement value (seconds/reps)
        const currentProgressRaw = habit.raw_lifetime_progress; 
        const progress = Math.min((currentProgressRaw / reqValue) * 100, 100);
        
        // Calculate remaining value in UI units (minutes/reps)
        const remainingRaw = Math.max(0, reqValue - currentProgressRaw);
        
        let remainingUIValue = remainingRaw;
        let unit = `${habit.unit} left`;
        
        // If it's a time habit, convert remaining seconds back to minutes for display
        if (habit.unit === 'min') {
            remainingUIValue = Math.ceil(remainingRaw / 60);
            unit = 'min left';
        } else {
            unit = `${habit.unit} left`;
        }
        
        nextBadgeProgress = {
          progressValue: progress,
          value: remainingUIValue,
          unit: unit
        };
      }
    }
  }

  const NextBadgeIcon = nextBadgeData ? (iconMap[nextBadgeData.icon_name] || Star) : Star;

  return (
    <div className="w-full max-w-lg mx-auto space-y-8 px-4 py-6">
      <PageHeader title="Your Growth Journey" />
      
      <div className="text-center">
        <p className="text-lg text-muted-foreground">
          Started on {format(startDate, 'PPP')} • Day {daysActive}
        </p>
      </div>
      
      {/* Journey Overview */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-semibold text-lg flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" />
            Journey Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">{daysActive}</p>
              <p className="text-sm text-muted-foreground mt-1">Days Active</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">{dailyStreak}</p>
              <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">{totalJourneyDays}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Days</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actionable Insights */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Actionable Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Based on your activity, your most productive time is:
          </p>
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 rounded-md">
            <p className="font-semibold text-yellow-800 dark:text-yellow-300 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              {bestTime !== '—' 
                ? `You're a ${bestTime} person! Try scheduling your most important tasks then.` 
                : 'Log more tasks to discover your best time!'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Badges and Gamification */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
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
                <Progress 
                  value={nextBadgeProgress.progressValue} 
                  className="h-2 flex-grow [&>div]:bg-yellow-500" 
                />
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  <span className="font-semibold text-yellow-600">{nextBadgeProgress.value}</span> {nextBadgeProgress.unit}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">All badges unlocked! You are a true champion.</p>
          )}
          
          <Button variant="outline" className="w-full mt-4">
            <Flame className="w-4 h-4 mr-2" />
            Use Streak Freeze ({dailyStreak} days streak)
          </Button>
        </CardContent>
      </Card>
      
      {/* Habit Progress */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Habit Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-5">
            {habits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{habit.habit_key.charAt(0).toUpperCase() + habit.habit_key.slice(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {habit.lifetime_progress} / {habit.long_term_goal} {habit.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{habit.momentum_level}</p>
                  <p className="text-sm text-muted-foreground">Momentum</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Journey;