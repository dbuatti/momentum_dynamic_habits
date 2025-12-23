"use client";

import React, { useState, useMemo } from 'react';
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
import { 
  Brain, LogOut, Anchor, Target, Sparkles, 
  ChevronDown, Settings2, Shield, Calendar, 
  Clock, Dumbbell, Wind, BookOpen, Music, 
  Home, Code, Sparkle, Pill, Timer
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
  teeth_brushing: Sparkle,
  medication: Pill,
};

const Settings = () => {
  const { session, signOut } = useSession();
  const { data, isLoading } = useJourneyData();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useUpdateProfile();
  
  // Track which habit is currently expanded to prevent re-sorting mid-edit
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);

  const habits = useMemo(() => data?.habits || [], [data]);
  const profile = useMemo(() => data?.profile, [data]);

  // Stable grouping
  const anchors = useMemo(() => habits.filter(h => h.category === 'anchor'), [habits]);
  const daily = useMemo(() => habits.filter(h => h.category !== 'anchor'), [habits]);

  if (isLoading || !data) return <SettingsSkeleton />;

  const updateHabitField = async (habitId: string, updates: any) => {
    const { error } = await supabase.from('user_habits').update(updates).eq('id', habitId);
    if (error) {
      showError('Failed to update');
    } else {
      showSuccess('Settings saved');
      // Invalidate queries but the UI state (activeHabitId) will keep the view stable
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
            <div className="flex-grow">
              <h4 className="font-bold text-base uppercase tracking-tight">{habit.habit_key.replace('_', ' ')}</h4>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                {habit.is_fixed ? 'Fixed' : (habit.is_trial_mode ? 'Trial' : 'Growth')} • {habit.frequency_per_week}x week
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-6 pt-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Strategy */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Growth Strategy</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'trial', label: 'Trial', active: habit.is_trial_mode, updates: { is_trial_mode: true, is_fixed: false } },
                  { id: 'growth', label: 'Growth', active: !habit.is_trial_mode && !habit.is_fixed, updates: { is_trial_mode: false, is_fixed: false } },
                  { id: 'fixed', label: 'Fixed', active: habit.is_fixed, updates: { is_fixed: true, is_trial_mode: false } }
                ].map(opt => (
                  <Button 
                    key={opt.id}
                    variant={opt.active ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-9 px-4 text-xs font-bold uppercase rounded-xl flex-1"
                    onClick={() => updateHabitField(habit.id, opt.updates)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Anchoring */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Anchor className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Category</Label>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-black/5">
                <span className="text-xs font-bold">Anchor Practice</span>
                <Switch 
                  checked={habit.category === 'anchor'} 
                  onCheckedChange={(val) => updateHabitField(habit.id, { category: val ? 'anchor' : 'daily' })} 
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Active Days</Label>
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

            {/* Time Window */}
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

            {/* Dynamic Chunking */}
            <div className="col-span-full">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <div>
                        <Label className="text-[10px] font-black uppercase">Auto-chunking</Label>
                        <p className="text-[9px] text-muted-foreground leading-tight">Calculates parts based on goal size</p>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase opacity-60"># of Parts</Label>
                                <Input 
                                  type="number" 
                                  min="1" max="10" 
                                  className="h-9 rounded-xl text-sm" 
                                  defaultValue={habit.num_chunks} 
                                  onBlur={(e) => updateHabitField(habit.id, { num_chunks: parseInt(e.target.value) })} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase opacity-60">Value per Part</Label>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  className="h-9 rounded-xl text-sm" 
                                  defaultValue={habit.chunk_duration} 
                                  onBlur={(e) => updateHabitField(habit.id, { chunk_duration: parseInt(e.target.value) })} 
                                />
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
      <PageHeader title="App Settings" backLink="/" />
      
      {/* Profile & Neurodivergent Mode */}
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
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Growth Profile</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm border-2 border-purple-100 bg-purple-50/50 dark:bg-purple-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 rounded-xl p-2.5">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight">Neurodivergent Mode</p>
                  <p className="text-xs text-muted-foreground">ADHD-friendly increments and modularity.</p>
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

      {/* Habit Sections */}
      <div className="space-y-10">
        {/* Anchor Practices */}
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

        {/* Daily Momentum */}
        {daily.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Target className="w-5 h-5 text-muted-foreground" />
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
          "The way you do anything is the way you do everything."
        </p>
      </div>
    </div>
  );
};

export default Settings;