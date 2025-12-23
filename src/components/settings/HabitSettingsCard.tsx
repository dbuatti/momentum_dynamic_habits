"use client";

import React, { useMemo } from 'react'; // Import useMemo
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { cn } from "@/lib/utils";
import { 
  Brain, LogOut, Anchor, Target, Sparkles, 
  Settings2, Shield, ShieldCheck, Calendar, 
  Clock, Dumbbell, Wind, BookOpen, Music, 
  Home, Code, Pill, Timer, BarChart3, Layers, Zap, Info, Eye, EyeOff
} from 'lucide-react';
import { UserHabitRecord } from '@/types/habit';
import { useUpdateHabitVisibility } from '@/hooks/useUpdateHabitVisibility';
import { initialHabits } from '@/lib/habit-data'; // Import initialHabits

interface HabitSettingsCardProps {
  habit: UserHabitRecord;
  onUpdateHabitField: (habitId: string, updates: any) => Promise<void>;
  onToggleDay: (habitId: string, currentDays: number[], dayIndex: number) => void;
  isActiveHabit: boolean;
}

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

export const HabitSettingsCard: React.FC<HabitSettingsCardProps> = ({
  habit,
  onUpdateHabitField,
  onToggleDay,
  isActiveHabit,
}) => {
  const Icon = habitIconMap[habit.habit_key] || Timer;
  
  // Find the initial habit configuration to get the unit
  const initialHabitConfig = useMemo(() => 
    initialHabits.find(h => h.id === habit.habit_key), 
    [habit.habit_key]
  );
  const habitUnit = initialHabitConfig?.unit || ''; // Default to empty string if not found

  const weeklyTotal = habit.current_daily_goal * habit.frequency_per_week;
  const calculatedParts = Math.ceil(habit.current_daily_goal / (habit.chunk_duration || 1));
  const { mutate: updateHabitVisibility } = useUpdateHabitVisibility();

  return (
    <AccordionItem 
      key={habit.id} 
      value={habit.id}
      className={cn(
        "border-2 rounded-2xl mb-4 overflow-hidden transition-all duration-300",
        isActiveHabit ? "border-primary bg-card shadow-md" : "border-transparent bg-muted/30"
      )}
    >
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <div className="flex items-center gap-4 text-left w-full">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isActiveHabit ? "bg-primary text-primary-foreground" : "bg-white border"
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
                onBlur={(e) => onUpdateHabitField(habit.id, { frequency_per_week: parseInt(e.target.value) })} 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase opacity-60">Session Goal ({habitUnit})</Label>
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
                  onUpdateHabitField(habit.id, updates);
                }} 
              />
            </div>
          </div>

          <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Weekly Total</span>
            <span className="text-sm font-black text-primary">{weeklyTotal} {habitUnit}</span>
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
                onClick={() => onUpdateHabitField(habit.id, { is_trial_mode: true, is_fixed: false })}
              >
                <Anchor className="w-3.5 h-3.5" />
                Trial (Anchoring Only)
              </Button>
              <Button 
                variant={!habit.is_trial_mode && !habit.is_fixed ? 'default' : 'outline'} 
                size="sm" 
                className="h-10 px-4 text-xs font-black uppercase rounded-xl justify-start gap-2"
                onClick={() => onUpdateHabitField(habit.id, { is_trial_mode: false, is_fixed: false })}
              >
                <Zap className="w-3.5 h-3.5" />
                Growth (Adaptive Scaling)
              </Button>
              <Button 
                variant={habit.is_fixed ? 'default' : 'outline'} 
                size="sm" 
                className="h-10 px-4 text-xs font-black uppercase rounded-xl justify-start gap-2"
                onClick={() => onUpdateHabitField(habit.id, { is_fixed: true, is_trial_mode: false })}
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
                onCheckedChange={(val) => onUpdateHabitField(habit.id, { category: val ? 'anchor' : 'daily' })} 
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
                    onClick={() => onToggleDay(habit.id, habit.days_of_week || [], idx)}
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
                onBlur={(e) => onUpdateHabitField(habit.id, { window_start: e.target.value || null })} 
              />
              <Input 
                type="time" 
                className="h-9 rounded-xl text-xs font-bold" 
                defaultValue={habit.window_end || ''} 
                onBlur={(e) => onUpdateHabitField(habit.id, { window_end: e.target.value || null })} 
              />
            </div>
          </div>

          {/* Plateau Days Required */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-primary" />
              <Label className="text-[10px] font-black uppercase tracking-widest">Plateau Days Required</Label>
            </div>
            <Input 
              type="number" 
              min="1" 
              className="h-9 rounded-xl text-sm font-bold" 
              defaultValue={habit.plateau_days_required} 
              onBlur={(e) => onUpdateHabitField(habit.id, { plateau_days_required: parseInt(e.target.value) })} 
            />
            <p className="text-[9px] text-muted-foreground italic px-1">
              Number of consistent days needed to trigger growth or complete trial.
            </p>
          </div>

          {/* Habit Visibility Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              {habit.is_visible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              <Label className="text-[10px] font-black uppercase tracking-widest">Show on Dashboard</Label>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-black/5">
              <div className="space-y-0.5">
                  <span className="text-xs font-bold block">Visible Habit</span>
                  <span className="text-[9px] text-muted-foreground">Toggle to show/hide this habit from your dashboard.</span>
              </div>
              <Switch 
                checked={habit.is_visible} 
                onCheckedChange={(val) => updateHabitVisibility({ habitKey: habit.habit_key, isVisible: val })} 
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
                  onCheckedChange={(val) => onUpdateHabitField(habit.id, { auto_chunking: val })} 
                />
              </div>
              
              {!(habit.auto_chunking ?? true) && (
                <div className="space-y-4 pt-4 border-t border-black/5">
                  <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase opacity-60">Manual Chunks</Label>
                      <Switch 
                        checked={habit.enable_chunks} 
                        onCheckedChange={(val) => onUpdateHabitField(habit.id, { enable_chunks: val })} 
                      />
                  </div>
                  {habit.enable_chunks && (
                      <div className="grid grid-cols-2 gap-4 items-end">
                          <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase opacity-60">Duration per Part ({habitUnit})</Label>
                              <Input 
                                type="number" 
                                min="1" 
                                className="h-10 rounded-xl text-sm font-bold" 
                                defaultValue={habit.chunk_duration} 
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value);
                                  const num = Math.ceil(habit.current_daily_goal / val);
                                  onUpdateHabitField(habit.id, { 
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