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
  Settings2, Shield, ShieldCheck, Calendar, 
  Clock, Dumbbell, Wind, BookOpen, Music, 
  Home, Code, Pill, Timer, BarChart3, Layers, Zap, Info, Eye, EyeOff, Plus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { useUpdateHabitVisibility } from '@/hooks/useUpdateHabitVisibility';
import { HabitSettingsCard } from '@/components/settings/HabitSettingsCard';
import { NewHabitModal } from '@/components/habits/NewHabitModal'; // Import NewHabitModal

const Settings = () => {
  const { session, signOut } = useSession();
  const { data, isLoading } = useJourneyData();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useUpdateProfile();
  
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [showNewHabitModal, setShowNewHabitModal] = useState(false); // State for modal

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

        {/* Create Custom Habit Button */}
        <Card className="rounded-3xl shadow-sm border-2 border-primary/10 bg-primary/5">
          <CardContent className="p-5">
            <Button 
              className="w-full h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white"
              onClick={() => setShowNewHabitModal(true)}
            >
              <Plus className="w-6 h-6 mr-2" />
              Create Custom Habit
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Define a habit with full control over all parameters
            </p>
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
              {anchors.map(habit => (
                <HabitSettingsCard
                  key={habit.id}
                  habit={habit}
                  onUpdateHabitField={updateHabitField}
                  onToggleDay={toggleDay}
                  isActiveHabit={activeHabitId === habit.id}
                />
              ))}
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
              {daily.map(habit => (
                <HabitSettingsCard
                  key={habit.id}
                  habit={habit}
                  onUpdateHabitField={updateHabitField}
                  onToggleDay={toggleDay}
                  isActiveHabit={activeHabitId === habit.id}
                />
              ))}
            </Accordion>
          </div>
        )}
      </div>

      <div className="pt-4 px-1">
        <p className="text-[10px] text-center text-muted-foreground font-medium italic">
          "Build the floor first. The ceiling will take care of itself."
        </p>
      </div>

      {/* New Habit Modal */}
      <NewHabitModal 
        isOpen={showNewHabitModal} 
        onClose={() => setShowNewHabitModal(false)} 
      />
    </div>
  );
};

export default Settings;