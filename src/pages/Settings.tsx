import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { SettingsSkeleton } from '@/components/dashboard/SettingsSkeleton';
import { Switch } from '@/components/ui/switch';
import { Brain, Zap, Lock, LogOut, Heart, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { session, signOut } = useSession();
  const { data, isLoading } = useJourneyData();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useUpdateProfile();

  if (isLoading || !data) return <SettingsSkeleton />;

  const { habits, profile } = data;

  const toggleHabitFixed = async (habitId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('user_habits')
      .update({ is_fixed: !currentStatus })
      .eq('id', habitId);
    
    if (error) showError('Failed to update habit');
    else {
      showSuccess(!currentStatus ? 'Goal set to Fixed' : 'Goal set to Dynamic');
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
    }
  };

  const updateMaxCap = async (habitId: string, cap: string) => {
    const numCap = cap === '' ? null : parseInt(cap);
    const { error } = await supabase.from('user_habits').update({ max_goal_cap: numCap }).eq('id', habitId);
    if (error) showError('Failed to update cap');
    else queryClient.invalidateQueries({ queryKey: ['journeyData'] });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      <PageHeader title="Settings" backLink="/" />
      
      <Card className="rounded-3xl shadow-sm border-0">
        <CardContent className="p-6 flex items-center space-x-4">
          <Avatar className="w-16 h-16 border-4 border-primary/10">
            <AvatarFallback>{session?.user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="font-bold text-lg">{profile?.first_name || session?.user?.email}</p>
            <p className="text-sm text-muted-foreground">Adaptive Growth Account</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm border-0 bg-purple-50 dark:bg-purple-950/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-500" />
              <div>
                <p className="font-bold">Neurodivergent Mode</p>
                <p className="text-xs text-muted-foreground">Longer plateaus, smaller increments.</p>
              </div>
            </div>
            <Switch 
              checked={profile?.neurodivergent_mode} 
              onCheckedChange={(val) => updateProfile({ neurodivergent_mode: val })} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm border-0">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-widest font-black">
            <Zap className="w-5 h-5 text-primary" />
            Habit Progression
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-4 p-5 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-base flex items-center gap-2">
                    {habit.habit_key.replace('_', ' ').toUpperCase()}
                    {habit.is_fixed && <Lock className="w-4 h-4 text-primary" />}
                  </h4>
                  <p className="text-xs font-bold text-muted-foreground mt-1">
                    Goal: {habit.current_daily_goal} {habit.unit}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-background p-1 px-2 rounded-full border shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Fixed Goal</span>
                    <Switch 
                      className="scale-75"
                      checked={habit.is_fixed} 
                      onCheckedChange={() => toggleHabitFixed(habit.id, habit.is_fixed)}
                    />
                  </div>
                </div>
              </div>
              
              {!habit.is_fixed && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase opacity-60">Max Goal Cap</Label>
                    <Input 
                      type="number" 
                      className="h-9 rounded-xl text-sm" 
                      defaultValue={habit.max_goal_cap || ''} 
                      onBlur={(e) => updateMaxCap(habit.id, e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Stabilization</p>
                    <p className="text-sm font-bold">{profile?.neurodivergent_mode ? 7 : 5} Days</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm border-0 border-destructive/20 bg-destructive/5 overflow-hidden">
        <CardContent className="p-6">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-bold text-destructive">Recovery Reset</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Feeling overwhelmed? Reduce all goals by 20%.</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-white transition-all font-bold text-xs uppercase">
                Apply Recovery
              </Button>
           </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-bold text-primary">Pro Tip:</span> Start with just one habit at a time to build cognitive momentum without burnout.
        </p>
      </div>
    </div>
  );
};

export default Settings;