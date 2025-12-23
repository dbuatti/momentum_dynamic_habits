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
import { Brain, Zap, Lock, LogOut, Heart, Volume2, Play, Bell, Trophy, Anchor, Target, Clock, Calendar, LayoutGrid, Sparkles } from 'lucide-react';
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
                <p className="text-xs text-muted-foreground">Optimized for ADHD/Neurodivergent brains.</p>
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
            Habit Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-4 p-5 bg-muted/30 rounded-3xl border border-transparent hover:border-primary/5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tight">{habit.habit_key.replace('_', ' ')}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full uppercase", 
                      habit.category === 'anchor' ? "bg-primary text-primary-foreground" : "bg-orange-100 text-orange-700"
                    )}>
                        {habit.category === 'anchor' ? 'Anchor' : 'Momentum'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Anchor</Label>
                    <Switch checked={habit.category === 'anchor'} onCheckedChange={(val) => updateHabitField(habit.id, { category: val ? 'anchor' : 'daily' })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Strategy</Label>
                  <div className="flex gap-2">
                    <Button variant={habit.is_trial_mode ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] font-black uppercase rounded-xl" onClick={() => updateHabitField(habit.id, { is_trial_mode: true })}>Trial</Button>
                    <Button variant={!habit.is_trial_mode && !habit.is_fixed ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] font-black uppercase rounded-xl" onClick={() => updateHabitField(habit.id, { is_trial_mode: false, is_fixed: false })}>Growth</Button>
                    <Button variant={habit.is_fixed ? 'default' : 'outline'} size="sm" className="h-8 text-[10px] font-black uppercase rounded-xl" onClick={() => updateHabitField(habit.id, { is_fixed: true, is_trial_mode: false })}>Fixed</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Frequency/Week</Label>
                  <Input type="number" min="1" max="7" className="h-8 rounded-xl" defaultValue={habit.frequency_per_week} onBlur={(e) => updateHabitField(habit.id, { frequency_per_week: parseInt(e.target.value) })} />
                </div>
              </div>

              {/* Dynamic Chunking Section */}
              <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-black/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <div>
                        <Label className="text-[10px] font-black uppercase">Auto-chunking</Label>
                        <p className="text-[9px] text-muted-foreground leading-tight">Calculates parts based on goal size</p>
                    </div>
                  </div>
                  <Switch checked={habit.auto_chunking ?? true} onCheckedChange={(val) => updateHabitField(habit.id, { auto_chunking: val })} />
                </div>
                
                {!(habit.auto_chunking ?? true) && (
                  <div className="space-y-3 pt-2 border-t border-black/5">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase opacity-60">Enable Manual Chunks</Label>
                        <Switch checked={habit.enable_chunks} onCheckedChange={(val) => updateHabitField(habit.id, { enable_chunks: val })} />
                    </div>
                    {habit.enable_chunks && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase opacity-60"># of Chunks</Label>
                                <Input type="number" min="1" max="10" className="h-7 text-xs rounded-lg" defaultValue={habit.num_chunks} onBlur={(e) => updateHabitField(habit.id, { num_chunks: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase opacity-60">Chunk Size</Label>
                                <Input type="number" min="1" className="h-7 text-xs rounded-lg" defaultValue={habit.chunk_duration} onBlur={(e) => updateHabitField(habit.id, { chunk_duration: parseInt(e.target.value) })} />
                            </div>
                        </div>
                    )}
                  </div>
                )}
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
                        className="h-8 w-8 rounded-lg p-0 text-[10px] font-black"
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