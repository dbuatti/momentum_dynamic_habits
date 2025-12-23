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
import { Brain, Zap, Lock, LogOut, Heart, Volume2, Play, Bell, Trophy, Anchor, Target, Clock, Calendar } from 'lucide-react';
import { playStartSound, playEndSound, playGoalSound } from '@/utils/audio';
import { cn } from "@/lib/utils";

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const Settings = () => {
  const { session, signOut } = useSession();
  const { data, isLoading } = useJourneyData();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useUpdateProfile();

  if (isLoading || !data) return <SettingsSkeleton />;

  const { habits, profile } = data;

  const updateHabitField = async (habitId: string, updates: any) => {
    const { error } = await supabase.from('user_habits').update(updates).eq('id', habitId);
    if (error) showError('Failed to update');
    else {
      showSuccess('Updated successfully');
      queryClient.invalidateQueries({ queryKey: ['journeyData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  };

  const toggleDay = (habitId: string, currentDays: number[], dayIndex: number) => {
    let newDays;
    if (currentDays.includes(dayIndex)) {
      newDays = currentDays.filter(d => d !== dayIndex);
    } else {
      newDays = [...currentDays, dayIndex].sort();
    }
    updateHabitField(habitId, { days_of_week: newDays });
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
            <p className="font-bold text-lg">{profile?.first_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">Neurodivergent Growth Profile</p>
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
                <p className="text-xs text-muted-foreground">Longer plateaus, more breathing room.</p>
              </div>
            </div>
            <Switch checked={profile?.neurodivergent_mode} onCheckedChange={(val) => updateProfile({ neurodivergent_mode: val })} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm border-0">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-widest font-black">
            <Target className="w-5 h-5 text-primary" />
            Adaptive Habit Lab
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-4 p-5 bg-muted/30 rounded-3xl border border-transparent hover:border-primary/5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tight">{habit.habit_key.replace('_', ' ')}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase", habit.category === 'anchor' ? "bg-primary text-white" : "bg-orange-100 text-orange-700")}>
                        {habit.category === 'anchor' ? 'Anchor' : 'Momentum'}
                    </span>
                    {habit.is_trial_mode && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Trial Mode</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Switch checked={habit.category === 'anchor'} onCheckedChange={(val) => updateHabitField(habit.id, { category: val ? 'anchor' : 'daily' })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Mode</Label>
                  <div className="flex gap-2">
                    <Button variant={habit.is_trial_mode ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] font-black uppercase rounded-xl" onClick={() => updateHabitField(habit.id, { is_trial_mode: true })}>Trial</Button>
                    <Button variant={!habit.is_trial_mode && !habit.is_fixed ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] font-black uppercase rounded-xl" onClick={() => updateHabitField(habit.id, { is_trial_mode: false, is_fixed: false })}>Growth</Button>
                    <Button variant={habit.is_fixed ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] font-black uppercase rounded-xl" onClick={() => updateHabitField(habit.id, { is_fixed: true, is_trial_mode: false })}>Fixed</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Frequency (weekly)</Label>
                  <Input type="number" min="1" max="7" className="h-8 rounded-xl" defaultValue={habit.frequency_per_week} onBlur={(e) => updateHabitField(habit.id, { frequency_per_week: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60">Scheduled Days</Label>
                <div className="flex justify-between gap-1">
                  {days.map((day, idx) => {
                    const isSelected = habit.days_of_week?.includes(idx);
                    return (
                      <Button
                        key={idx}
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className={cn("h-8 w-8 rounded-lg p-0 text-[10px] font-black", isSelected ? "bg-primary" : "bg-white")}
                        onClick={() => toggleDay(habit.id, habit.days_of_week || [], idx)}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase opacity-60">Window Start</Label>
                    <Input type="time" className="h-8 rounded-xl" defaultValue={habit.window_start || ''} onBlur={(e) => updateHabitField(habit.id, { window_start: e.target.value || null })} />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                    <Input type="time" className="h-8 rounded-xl" defaultValue={habit.window_end || ''} onBlur={(e) => updateHabitField(habit.id, { window_end: e.target.value || null })} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;