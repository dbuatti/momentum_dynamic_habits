"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { 
  Brain, LogOut, Anchor, Target, Sparkles, 
  Settings2, Shield, ShieldCheck, Calendar, // added ShieldCheck here
  Clock, Dumbbell, Wind, BookOpen, Music, 
  Home, Code, Pill, Timer, BarChart3, Layers, Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const habitIconMap: { [key: string]: React.ElementType } = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home,
  projectwork: Code,
  teeth_brushing: Sparkles,
  medication: Pill,
};

const Settings = () => {
  const { session, signOut } = useSession();
  const { data, isLoading } = useJourneyData();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useUpdateProfile();
  
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);

  const habits = useMemo(() => data?.habits || [], [data]);
  const profile = useMemo(() => data?.profile, [data]);

  const anchors = useMemo(() => habits.filter(h => h.category === 'anchor'), [habits]);
  const daily = useMemo(() => habits.filter(h => h.category !== 'anchor'), [habits]);

  if (isLoading || !data) return <SettingsSkeleton />;

  const updateHabitField = async (habitId: string, updates: any) => {
    const { error } = await supabase.from('user_habits').update(updates).eq('id', habitId);
    if (error) {
      showError('Failed to update settings');
    } else {
      showSuccess('Settings saved');
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

  const renderHabitSettings = (habit: any) => {
    const Icon = habitIconMap[habit.habit_key] || Timer;
    const isExpanded = activeHabitId === habit.id;
    const weeklyTotal = habit.current_daily_goal * habit.frequency_per_week;

    const calculatedParts = Math.ceil(habit.current_daily_goal / (habit.chunk_duration || 1));

    return (
      <AccordionItem 
        key={habit.id} 
        value={habit.id}
        className={cn(
          "border-2 rounded-2xl mb-4 overflow-hidden transition-all duration-300",
          isExpanded ? "border-primary bg-card shadow-md" : "border-transparent bg-muted/30"
        )}
      >
        <AccordionTrigger className="px-5 py-4 hover:no-underline">
          <div className="flex items-center gap-4 text-left w-full">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isExpanded ? "bg-primary text-primary-foreground" : "bg-white border"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-base uppercase tracking-tight truncate">
                {habit.habit_key.replace('_', ' ')}
              </h4>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest truncate">
                {habit.is_fixed ? 'Fixed' : (habit.is_trial_mode ? 'Trial Phase' : 'Growth Mode')} • {habit.frequency_per_week}x/week
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-6 pt-2 space-y-6">
          {/* Macro Goal Section */}
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-primary" />
              <Label className="text-[10px] font-black uppercase tracking-widest">Macro Configuration</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-60">Frequency (Sessions/Week)</Label>
                <Input 
                  type="number" 
                  min="1" max="7" 
                  className="h-9 rounded-xl text-sm font-bold" 
                  defaultValue={habit.frequency_per_week} 
                  onBlur={(e) => updateHabitField(habit.id, { frequency_per_week: parseInt(e.target.value) })} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-60">Session Goal ({habit.unit})</Label>
                <Input 
                  type="number" 
                  min="1" 
                  className="h-9 rounded-xl text-sm font-bold" 
                  defaultValue={habit.current_daily_goal} 
                  onBlur={(e) => {
                    const newGoal = parseInt(e.target.value);
                    const updates: any = { current_daily_goal: newGoal };
                    if (habit.enable_chunks && !habit.auto_chunking) {
                      updates.num_chunks = Math.ceil(newGoal / (habit.chunk_duration || 1));
                    }
                    updateHabitField(habit.id, updates);
                  }} 
                />
              </div>
            </div>

            <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Weekly Total</span>
              <span className="text-sm font-black text-primary">{weeklyTotal} {habit.unit}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Operating Mode</Label>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant={habit.is_trial_mode ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-10 px-4 text-xs font-black uppercase rounded-xl justify-start gap-2"
                  onClick={() => updateHabitField(habit.id, { is_trial_mode: true, is_fixed: false })}
                >
                  <Anchor className="w-3.5 h-3.5" />
                  Trial (Anchoring Only)
                </Button>
                <Button 
                  variant={!habit.is_trial_mode && !habit.is_fixed ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-10 px-4 text-xs font-black uppercase rounded-xl justify-start gap-2"
                  onClick={() => updateHabitField(habit.id, { is_trial_mode: false, is_fixed: false })}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Growth (Adaptive Scaling)
                </Button>
                <Button 
                  variant={habit.is_fixed ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-10 px-4 text-xs font-black uppercase rounded-xl justify-start gap-2"
                  onClick={() => updateHabitField(habit.id, { is_fixed: true, is_trial_mode: false })}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Fixed (Maintenance)
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground italic px-1">
                {habit.is_trial_mode ? "Focus on showing up once or twice a week. No growth suggestions." : 
                 habit.is_fixed ? "Ideal for habits that are perfect as they are." : 
                 "Automatically scales your goals based on weekly consistency."}
              </p>
            </div>

            {/* Anchoring Toggle */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Anchor className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Practice Type</Label>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-black/5">
                <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Anchor Practice</span>
                    <span className="text-[9px] text-muted-foreground">Foundational habits prioritized in dash.</span>
                </div>
                <Switch 
                  checked={habit.category === 'anchor'} 
                  onCheckedChange={(val) => updateHabitField(habit.id, { category: val ? 'anchor' : 'daily' })} 
                />
              </div>
            </div>

            {/* Active Days Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Active Schedule</Label>
              </div>
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

            {/* Time Window Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Time Window</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="time" 
                  className="h-9 rounded-xl text-xs font-bold" 
                  defaultValue={habit.window_start || ''} 
                  onBlur={(e) => updateHabitField(habit.id, { window_start: e.target.value || null })} 
                />
                <Input 
                  type="time" 
                  className="h-9 rounded-xl text-xs font-bold" 
                  defaultValue={habit.window_end || ''} 
                  onBlur={(e) => updateHabitField(habit.id, { window_end: e.target.value || null })} 
                />
              </div>
            </div>

            {/* Auto-Chunking (Session Granularity) */}
            <div className="col-span-full">
              <div className="p-4 bg-muted/50 rounded-2xl border border-black/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <div>
                        <Label className="text-[10px] font-black uppercase">Adaptive Auto-chunking</Label>
                        <p className="text-[9px] text-muted-foreground leading-tight">Breaks sessions into micro-capsules to reduce overwhelm.</p>
                    </div>
                  </div>
                  <Switch 
                    checked={habit.auto_chunking ?? true} 
                    onCheckedChange={(val) => updateHabitField(habit.id, { auto_chunking: val })} 
                  />
                </div>
                
                {!(habit.auto_chunking ?? true) && (
                  <div className="space-y-4 pt-4 border-t border-black/5">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase opacity-60">Manual Chunks</Label>
                        <Switch 
                          checked={habit.enable_chunks} 
                          onCheckedChange={(val) => updateHabitField(habit.id, { enable_chunks: val })} 
                        />
                    </div>
                    {habit.enable_chunks && (
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase opacity-60">Duration per Part ({habit.unit})</Label>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  className="h-10 rounded-xl text-sm font-bold" 
                                  defaultValue={habit.chunk_duration} 
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    const num = Math.ceil(habit.current_daily_goal / val);
                                    updateHabitField(habit.id, { 
                                      chunk_duration: val,
                                      num_chunks: num
                                    });
                                  }} 
                                />
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-black/5 flex items-center gap-3 h-10">
                                <div className="bg-primary/10 p-1 rounded-md">
                                    <Layers className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-[8px] font-black uppercase opacity-60 leading-none">Result</p>
                                    <p className="text-[11px] font-black text-primary leading-tight">{calculatedParts} parts / session</p>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title="Growth Settings" backLink="/" />
      
      {/* Profile Header */}
      <div className="space-y-4">
        <Card className="rounded-3xl shadow-sm border-0">
          <CardContent className="p-6 flex items-center space-x-4">
            <Avatar className="w-16 h-16 border-4 border-primary/10">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {session?.user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-black text-xl leading-tight">{profile?.first_name || 'User'}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Focus Mode: {profile?.neurodivergent_mode ? 'ND Optimized' : 'Standard'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Global neurodivergent toggle */}
        <Card className="rounded-3xl shadow-sm border-2 border-purple-100 bg-purple-50/50 dark:bg-purple-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 rounded-xl p-2.5">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight">Neurodivergent Mode</p>
                  <p className="text-xs text-muted-foreground">Enables small increments and modular task capsules.</p>
                </div>
              </div>
              <Switch 
                checked={profile?.neurodivergent_mode} 
                onCheckedChange={(val) => updateProfile({ neurodivergent_mode: val })} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-10">
        {/* Anchor Habits Section */}
        {anchors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Anchor className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary/80">Anchor Practices</h2>
            </div>
            <Accordion 
              type="single" 
              collapsible 
              value={activeHabitId || ""} 
              onValueChange={setActiveHabitId}
              className="w-full"
            >
              {anchors.map(renderHabitSettings)}
            </Accordion>
          </div>
        )}

        {/* Daily Habits Section */}
        {daily.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Momentum</h2>
            </div>
            <Accordion 
              type="single" 
              collapsible 
              value={activeHabitId || ""} 
              onValueChange={setActiveHabitId}
              className="w-full"
            >
              {daily.map(renderHabitSettings)}
            </Accordion>
          </div>
        )}
      </div>

      <div className="pt-4 px-1">
        <p className="text-[10px] text-center text-muted-foreground font-medium italic">
          "Build the floor first. The ceiling will take care of itself."
        </p>
      </div>
    </div>
  );
};

export default Settings;