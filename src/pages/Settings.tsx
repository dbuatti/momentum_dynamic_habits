import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, TrendingUp, Star, Flame, Shield, Crown, Zap, Trophy, Sparkles, Mountain, Award, Sun, Moon, Heart, Dumbbell, Timer, LogOut, AlertCircle, Loader2, Clock, User, Palette, Wind, Snowflake, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useJourneyData } from '@/hooks/useJourneyData';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { SettingsSkeleton } from '@/components/dashboard/SettingsSkeleton';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';

const iconMap: { [key: string]: React.ElementType } = {
  Star, Flame, Shield, Target, Crown, Zap, Trophy, Sparkles, Mountain, Award, Sun, Moon, Heart, Dumbbell, Wind,
};

const Settings = () => {
  const { session, signOut } = useSession();
  const { data, isLoading, isError } = useJourneyData();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  
  const [firstName, setFirstName] = useState(data?.profile?.first_name || '');
  const [lastName, setLastName] = useState(data?.profile?.last_name || '');

  const toggleFreeze = async (habitId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('user_habits')
      .update({ is_frozen: !currentStatus })
      .eq('id', habitId);
    
    if (error) showError('Failed to update habit status');
    else {
      showSuccess(!currentStatus ? 'Goal frozen' : 'Goal unfrozen');
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
    }
  };

  const updateMaxCap = async (habitId: string, cap: string) => {
    const numCap = cap === '' ? null : parseInt(cap);
    const { error } = await supabase
      .from('user_habits')
      .update({ max_goal_cap: numCap })
      .eq('id', habitId);
    
    if (error) showError('Failed to update cap');
    else queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
  };

  if (isLoading) return <SettingsSkeleton />;

  const { habits, profile } = data;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      <PageHeader title="Settings" backLink="/" />
      
      {/* Profile & Identity */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardContent className="p-5 flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback>{session?.user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="font-semibold text-lg">{session?.user?.email}</p>
            <p className="text-sm text-muted-foreground">Neurodivergent-friendly pacing active</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => signOut()}>
            <LogOut className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Habit Controls */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-lg flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Adaptive Habit Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-6">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-3 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base">{habit.habit_key.replace('_', ' ').toUpperCase()}</h4>
                  <p className="text-sm text-muted-foreground">Current goal: {habit.current_daily_goal} {habit.unit}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`freeze-${habit.id}`} className="text-xs">Freeze Goal</Label>
                  <Switch 
                    id={`freeze-${habit.id}`} 
                    checked={habit.is_frozen} 
                    onCheckedChange={() => toggleFreeze(habit.id, habit.is_frozen)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <Label className="text-xs">Max Goal Cap</Label>
                  <Input 
                    type="number"
                    placeholder="No limit"
                    className="h-9 text-sm"
                    defaultValue={habit.max_goal_cap || ''}
                    onBlur={(e) => updateMaxCap(habit.id, e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Stabilization</span>
                  <span className="text-sm font-medium">{habit.plateau_days_required} days</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone & Reset */}
      <Card className="rounded-2xl shadow-sm border-0 bg-destructive/5">
        <CardContent className="p-5">
           <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-destructive">Recovery Reset</p>
                <p className="text-sm text-muted-foreground">Feeling overwhelmed? Reduce all goals by 20% for a week.</p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white">
                Apply Recovery
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;