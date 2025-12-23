import React from 'react';
import { useParams } from 'react-router-dom';
import HabitLogTemplate from '@/components/habits/HabitLogTemplate'; // Import the new template
import NotFound from './NotFound';
import { useDashboardData } from '@/hooks/useDashboardData'; // Import useDashboardData
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'; // Import skeleton
import { AlertCircle } from 'lucide-react'; // Import icons
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils'; // Import from centralized utility

const LogHabit = () => {
  const { habitKey } = useParams<{ habitKey: string }>();
  const { data: dashboardData, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return <DashboardSkeleton />; // Use a generic skeleton for loading
  }

  if (isError || !dashboardData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Could not load Habit Data</h2>
        <p className="text-lg text-muted-foreground">There was an error fetching your habit details. Please try again later.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  const habit = dashboardData.habits.find(h => h.key === habitKey);

  if (!habit) {
    return <NotFound />;
  }

  const habitIcon = habitIconMap[habit.key] || habitIconMap.custom_habit; // Fallback to custom_habit icon
  const habitColor = habitColorMap[habit.key] || 'blue'; // Fallback to blue color

  return (
    <HabitLogTemplate
      habit={habit}
      habitIcon={habitIcon}
      habitColor={habitColor}
      neurodivergentMode={dashboardData.neurodivergentMode}
      bestTime={dashboardData.patterns.bestTime}
    />
  );
};

export default LogHabit;