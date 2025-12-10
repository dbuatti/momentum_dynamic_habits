import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Target, TrendingUp, Star, Flame, Shield, Crown, Zap, Trophy, Sparkles, Mountain, Award, Sun, Moon, Heart, Volume2, Dumbbell, Timer, LogOut, AlertCircle, Loader2, Clock
} from 'lucide-react'; // Removed unused icons: Smile, CloudRain, Trees, Waves, Wind, Bird, Droplets
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useJourneyData } from '@/hooks/useJourneyData';
import { format, differenceInDays, startOfDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { SettingsSkeleton } from '@/components/dashboard/SettingsSkeleton';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input'; // Import Input component
import { Label } from '@/components/ui/label'; // Import Label component
import { PageHeader } from '@/components/layout/PageHeader'; // Import PageHeader

const iconMap: { [key: string]: React.ElementType } = { Star, Flame, Shield, Target, Crown, Zap, Trophy, Sparkles, Mountain, Award, Sun, Moon, Heart };

const BadgeIcon = ({ iconName, label, achieved }: { iconName: string, label: string, achieved?: boolean }) => {
  const Icon = iconMap[iconName] || Star;
  return (
    <div className="flex flex-col items-center space-y-1 text-center">
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", achieved ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-100 dark:bg-gray-800')}>
        <Icon className={cn("w-7 h-7", achieved ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500')} />
      </div>
      <p className={cn("text-xs font-medium", achieved ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
    </div>
  );
};

// Removed SoundOptionProps and SoundOption component as meditation sound selection is removed.

const MomentumBadge = ({ level }: { level: string }) => {
  if (level === 'Strong' || level === 'Crushing') {
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300">
        <TrendingUp className="w-4 h-4 mr-1.5" />
        Ahead of schedule
      </Badge>
    );
  }
  return <Badge variant="secondary">Building steadily</Badge>;
};

const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const timeOptions = Array.from({ length: 24 }, (_, i) => 
  i.toString().padStart(2, '0') + ':00'
);

const Settings = () => {
  const { session, signOut } = useSession();
  const { data, isLoading, isError } = useJourneyData();
  const queryClient = useQueryClient();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();

  const { mutate: resetProgress, isPending: isResetting } = useMutation({
      mutationFn: async () => {
          const { error } = await supabase.functions.invoke('reset-user-progress');
          if (error) throw error;
      },
      onSuccess: () => {
          showSuccess('Your progress has been reset.');
          queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
          queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      },
      onError: (error) => {
          showError(`Failed to reset progress: ${error.message}`);
      }
  });

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return <SettingsSkeleton />;
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

  const { profile, habits, allBadges, achievedBadges } = data;
  const pushupHabit = habits.find(h => h.habit_key === 'pushups');
  const meditationHabit = habits.find(h => h.habit_key === 'meditation');
  const achievedBadgeIds = new Set(achievedBadges.map(b => b.badge_id));

  const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
  const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  const totalJourneyDays = meditationHabit ? differenceInDays(new Date(meditationHabit.target_completion_date), startDate) : 0;
  // Removed selectedMeditationSound as it's no longer used
  const selectedTimezone = profile?.timezone || 'UTC';
  const defaultAutoScheduleStartTime = profile?.default_auto_schedule_start_time || '09:00';
  const defaultAutoScheduleEndTime = profile?.default_auto_schedule_end_time || '17:00';
  const [firstName, setFirstName] = useState(profile?.first_name || ''); // Use local state for input
  const [lastName, setLastName] = useState(profile?.last_name || ''); // Use local state for input

  // Update local state when profile data changes
  React.useEffect(() => {
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
  }, [profile?.first_name, profile?.last_name]);

  // Removed meditationSounds array as it's no longer used

  // Removed handleSoundSelect as it's no longer used

  const handleTimezoneSelect = (timezone: string) => {
    if (timezone !== selectedTimezone) {
      updateProfile({ timezone: timezone });
    }
  };

  const handleStartTimeSelect = (time: string) => {
    if (time !== defaultAutoScheduleStartTime) {
      updateProfile({ default_auto_schedule_start_time: time });
    }
  };

  const handleEndTimeSelect = (time: string) => {
    if (time !== defaultAutoScheduleEndTime) {
      updateProfile({ default_auto_schedule_end_time: time });
    }
  };

  const handleFirstNameBlur = () => {
    if (firstName !== profile?.first_name) {
      updateProfile({ first_name: firstName });
    }
  };

  const handleLastNameBlur = () => {
    if (lastName !== profile?.last_name) {
      updateProfile({ last_name: lastName });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <PageHeader title="Settings" backLink="/" />

      {session?.user && (
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={session.user.user_metadata?.avatar_url} />
              <AvatarFallback>{session.user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{session.user.email}</p>
              <p className="text-sm text-muted-foreground">Logged in</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="ml-auto"><LogOut className="w-5 h-5" /></Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={handleFirstNameBlur}
              disabled={isUpdatingProfile}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={handleLastNameBlur}
              disabled={isUpdatingProfile}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-start space-x-4">
          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 shrink-0"></div>
          <div>
            <h3 className="font-semibold">Adaptive Goals</h3>
            <p className="text-sm text-muted-foreground">Your daily goals adjust automatically based on your performance. If you're struggling, we'll ease up. If you're crushing it, we'll challenge you more.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Overview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div><p className="text-3xl font-bold">{daysActive}</p><p className="text-sm text-muted-foreground">days active</p></div>
          <div><p className="text-3xl font-bold">{totalJourneyDays}</p><p className="text-sm text-muted-foreground">total journey days</p></div>
          <div><p className="text-xl font-semibold">{format(startDate, 'MMM d')}</p><p className="text-sm text-muted-foreground">started</p></div>
          {meditationHabit && <div><p className="text-xl font-semibold">{format(new Date(meditationHabit.target_completion_date), 'MMM d, yyyy')}</p><p className="text-sm text-muted-foreground">target completion</p></div>}
        </CardContent>
      </Card>

      {pushupHabit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Push-Ups Journey</CardTitle>
            <MomentumBadge level={pushupHabit.momentum_level} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold">{pushupHabit.current_daily_goal}</span>
              <span className="text-muted-foreground">/day</span>
              <span className="flex-grow text-right text-sm text-muted-foreground">target: <span className="font-semibold text-foreground">{pushupHabit.long_term_goal}</span></span>
            </div>
            <Progress value={(pushupHabit.current_daily_goal / pushupHabit.long_term_goal) * 100} className="w-full h-2 my-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1.5"><Calendar className="w-4 h-4" /><span>{differenceInDays(new Date(pushupHabit.target_completion_date), new Date())} days to go</span></div>
              <div className="flex items-center space-x-1.5"><Target className="w-4 h-4" /><span>{format(new Date(pushupHabit.target_completion_date), 'MMM yyyy')}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {meditationHabit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Meditation Journey</CardTitle>
            <MomentumBadge level={meditationHabit.momentum_level} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold">{meditationHabit.current_daily_goal}</span>
              <span className="text-muted-foreground">min/day</span>
              <span className="flex-grow text-right text-sm text-muted-foreground">target: <span className="font-semibold text-foreground">{meditationHabit.long_term_goal} min</span></span>
            </div>
            <Progress value={(meditationHabit.current_daily_goal / meditationHabit.long_term_goal) * 100} className="w-full h-2 my-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1.5"><Calendar className="w-4 h-4" /><span>{differenceInDays(new Date(meditationHabit.target_completion_date), new Date())} days to go</span></div>
              <div className="flex items-center space-x-1.5"><Target className="w-4 h-4" /><span>{format(new Date(meditationHabit.target_completion_date), 'MMM yyyy')}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">BADGES ({achievedBadgeIds.size}/{allBadges.length})</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          {allBadges.map(badge => (
            <BadgeIcon key={badge.id} iconName={badge.icon_name} label={badge.name} achieved={achievedBadgeIds.has(badge.id)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Momentum Levels</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3"><div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div><div><h4 className="font-semibold">Struggling</h4><p className="text-sm text-muted-foreground">Goals reduced, timeline may extend. Focus on showing up.</p></div></div>
          <div className="flex items-start space-x-3"><div className="w-3 h-3 rounded-full bg-gray-400 mt-1.5 shrink-0"></div><div><h4 className="font-semibold">Building</h4><p className="text-sm text-muted-foreground">Steady progress. Goals increase gradually.</p></div></div>
          <div className="flex items-start space-x-3"><div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0"></div><div><h4 className="font-semibold">Strong</h4><p className="text-sm text-muted-foreground">Great consistency! Goals increasing faster.</p></div></div>
          <div className="flex items-start space-x-3"><div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 shrink-0"></div><div><h4 className="font-semibold">Crushing</h4><p className="text-sm text-muted-foreground">Ahead of schedule! Maximum progression.</p></div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center space-x-2"><Calendar className="w-5 h-5 text-muted-foreground" /><CardTitle className="text-lg">Timezone</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedTimezone} onValueChange={handleTimezoneSelect} disabled={isUpdatingProfile}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              {commonTimezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            Setting your timezone ensures that daily progress and "Best time" calculations are accurate for your local time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center space-x-2"><Clock className="w-5 h-5 text-muted-foreground" /><CardTitle className="text-lg">Auto-Schedule Defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Default Start Time</p>
            <Select value={defaultAutoScheduleStartTime} onValueChange={handleStartTimeSelect} disabled={isUpdatingProfile}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Default End Time</p>
            <Select value={defaultAutoScheduleEndTime} onValueChange={handleEndTimeSelect} disabled={isUpdatingProfile}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            These times will be used as defaults when generating your daily schedule.
          </p>
        </CardContent>
      </Card>

      <div className="text-center py-6">
        <p className="text-sm font-semibold text-muted-foreground tracking-widest mb-4">LIFETIME PROGRESS</p>
        <div className="flex justify-center items-baseline space-x-8">
          {pushupHabit && <div className="flex items-center space-x-2"><Dumbbell className="w-5 h-5 text-orange-500" /><div><p className="text-2xl font-bold">{pushupHabit.lifetime_progress}</p><p className="text-xs text-muted-foreground">push-ups</p></div></div>}
          {meditationHabit && <div className="flex items-center space-x-2"><Timer className="w-5 h-5 text-indigo-500" /><div><p className="text-2xl font-bold">{meditationHabit.lifetime_progress}m</p><p className="text-xs text-muted-foreground">meditation</p></div></div>}
        </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex justify-between items-center">
                  <div>
                      <p className="font-semibold">Reset All Progress</p>
                      <p className="text-sm text-muted-foreground">This will permanently delete all your logged habits and badges. This action cannot be undone.</p>
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={isResetting}>
                              {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset'}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete all your progress, including completed tasks, badges, and streaks.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => resetProgress()}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
          </CardContent>
      </Card>
    </div>
  );
};

export default Settings;