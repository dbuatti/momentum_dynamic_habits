"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  Anchor, Target, Sparkles, ShieldCheck, Calendar, 
  Clock, Dumbbell, Wind, BookOpen, Music, 
  Home, Code, Pill, Timer, BarChart3, Layers, Zap, Info, Eye, EyeOff, Link as LinkIcon
} from 'lucide-react';
import { UserHabitRecord } from '@/types/habit';
import { useUpdateHabitVisibility } from '@/hooks/useUpdateHabitVisibility';
import { initialHabits } from '@/lib/habit-data';
import { habitIcons, habitCategories, habitUnits, habitModes } from '@/lib/habit-templates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJourneyData } from '@/hooks/useJourneyData';

interface HabitSettingsCardProps {
  habit: UserHabitRecord;
  onUpdateHabitField: (habitId: string, updates: any) => Promise<void>;
  onToggleDay: (habitId: string, currentDays: number[], dayIndex: number) => void;
  isActiveHabit: boolean;
}

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getHabitIcon = (habitKey: string) => {
  const foundIcon = habitIcons.find(i => i.value === habitKey);
  if (foundIcon) return foundIcon.icon;

  const initialHabitConfig = initialHabits.find(h => h.id === habitKey);
  if (initialHabitConfig) {
    const initialHabitIconMap: { [key: string]: React.ElementType } = {
      pushups: Dumbbell, meditation: Wind, kinesiology: BookOpen, piano: Music,
      housework: Home, projectwork: Code, teeth_brushing: Sparkles, medication: Pill,
    };
    return initialHabitIconMap[habitKey] || Target;
  }
  return Target;
};

export const HabitSettingsCard: React.FC<HabitSettingsCardProps> = ({
  habit,
  onUpdateHabitField,
  onToggleDay,
  isActiveHabit,
}) => {
  const Icon = getHabitIcon(habit.habit_key) || Target;
  const { mutate: updateHabitVisibility } = useUpdateHabitVisibility();
  const { data: journeyData } = useJourneyData();

  const habitUnit = habit.unit || '';

  // Use allHabits for dependency selection
  const otherHabits = useMemo(() => {
    return (journeyData?.allHabits || []).filter(h => h.id !== habit.id);
  }, [journeyData?.allHabits, habit.id]);

  return (
    <AccordionItem 
      key={habit.id} 
      value={habit.id}
      className={cn(
        "border-2 rounded-3xl mb-4 overflow-hidden transition-all duration-500",
        isActiveHabit ? "border-primary/40 bg-card shadow-xl scale-[1.01]" : "border-transparent bg-muted/20"
      )}
    >
      <AccordionTrigger className="px-6 py-5 hover:no-underline group">
        <div className="flex flex-col w-full text-left gap-2">
          <div className="flex items-center gap-5 text-left w-full">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
              isActiveHabit ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-background border shadow-sm"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-grow">
              <h4 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors capitalize">
                {habit.name || habit.habit_key.replace('_', ' ')}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className={cn(
                   "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                   habit.is_fixed ? "bg-blue-50 text-blue-600 border-blue-200" : 
                   habit.is_trial_mode ? "bg-amber-50 text-amber-600 border-amber-200" : 
                   "bg-green-50 text-green-600 border-green-200"
                 )}>
                   {habit.is_fixed ? 'Fixed' : (habit.is_trial_mode ? 'Trial' : 'Growth')}
                 </span>
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                   • {habit.frequency_per_week}x Weekly
                 </span>
              </div>
            </div>
          </div>
          {habit.dependent_on_habit_id && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 ml-[72px]">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Depends on: {otherHabits.find(h => h.id === habit.dependent_on_habit_id)?.name || 'Unknown Habit'}</span>
            </div>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-6 pb-8 pt-2">
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="basics" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Basics</TabsTrigger>
            <TabsTrigger value="schedule" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Schedule</TabsTrigger>
            <TabsTrigger value="advanced" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Logic</TabsTrigger>
          </TabsList>

          {/* BASICS TAB: Core Goal and Mode */}
          <TabsContent value="basics" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-2 gap-4 bg-primary/[0.03] p-4 rounded-2xl border border-primary/10">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Daily Target</Label>
                 <div className="relative">
                   <Input 
                     type="number" 
                     className="pl-3 pr-12 h-11 rounded-xl font-bold text-base" 
                     defaultValue={habit.current_daily_goal} 
                     onBlur={(e) => onUpdateHabitField(habit.id, { current_daily_goal: parseInt(e.target.value) })}
                   />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-40 uppercase">{habitUnit}</span>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Weekly Sessions</Label>
                 <Input 
                    type="number" 
                    min="1" max="7"
                    className="h-11 rounded-xl font-bold text-base" 
                    defaultValue={habit.frequency_per_week}
                    onBlur={(e) => onUpdateHabitField(habit.id, { frequency_per_week: parseInt(e.target.value) })}
                  />
               </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Operating Mode</Label>
              <div className="flex flex-col gap-2">
                {habitModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => onUpdateHabitField(habit.id, { 
                      is_trial_mode: mode.value === 'Trial', 
                      is_fixed: mode.value === 'Fixed' 
                    })}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                      (habit.is_trial_mode && mode.value === 'Trial') || (habit.is_fixed && mode.value === 'Fixed') || (!habit.is_trial_mode && !habit.is_fixed && mode.value === 'Growth')
                        ? "border-primary bg-primary/[0.02] shadow-sm"
                        : "border-transparent bg-muted/30 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", (habit.is_trial_mode && mode.value === 'Trial') || (habit.is_fixed && mode.value === 'Fixed') || (!habit.is_trial_mode && !habit.is_fixed && mode.value === 'Growth') ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground")}>
                        <mode.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase leading-none">{mode.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{mode.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* SCHEDULE TAB: Days and Time Windows */}
          <TabsContent value="schedule" className="space-y-6 focus-visible:outline-none">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Active Days</Label>
              <div className="flex justify-between bg-muted/30 p-2 rounded-2xl border border-black/5">
                {days.map((day, idx) => (
                  <Button
                    key={idx}
                    variant={habit.days_of_week?.includes(idx) ? "default" : "ghost"}
                    className={cn(
                        "h-10 w-10 rounded-xl font-black text-xs transition-all",
                        habit.days_of_week?.includes(idx) ? "shadow-md" : "hover:bg-background"
                    )}
                    onClick={() => onToggleDay(habit.id, habit.days_of_week || [], idx)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <div className="flex items-center gap-2 ml-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <Label className="text-[10px] font-black uppercase opacity-60">Window Start</Label>
                 </div>
                 <Input type="time" className="rounded-xl h-11 font-bold" defaultValue={habit.window_start || ''} onBlur={(e) => onUpdateHabitField(habit.id, { window_start: e.target.value })} />
               </div>
               <div className="space-y-2">
                 <div className="flex items-center gap-2 ml-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                 </div>
                 <Input type="time" className="rounded-xl h-11 font-bold" defaultValue={habit.window_end || ''} onBlur={(e) => onUpdateHabitField(habit.id, { window_end: e.target.value })} />
               </div>
            </div>
          </TabsContent>

          {/* LOGIC TAB: Visibility, Plateau, Chunking */}
          <TabsContent value="advanced" className="space-y-4 focus-visible:outline-none">
             <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex gap-4">
                  <div className="bg-blue-500/20 p-2 rounded-xl">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Adaptive Auto-Chunking</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Automagically break sessions into capsules.</p>
                  </div>
                </div>
                <Switch 
                  checked={habit.auto_chunking} 
                  onCheckedChange={(v) => onUpdateHabitField(habit.id, { auto_chunking: v })} 
                />
             </div>
             
             <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex gap-4">
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Show on Dashboard</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Toggle visibility without losing progress.</p>
                  </div>
                </div>
                <Switch 
                  checked={habit.is_visible} 
                  onCheckedChange={(v) => updateHabitVisibility({ habitKey: habit.habit_key, isVisible: v })} 
                />
             </div>

             <div className="p-4 rounded-2xl bg-muted/30 border border-black/5 space-y-3">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-[10px] font-black uppercase opacity-60">Growth Threshold</Label>
                </div>
                <div className="flex items-center gap-4">
                    <Input 
                        type="number" 
                        className="h-10 w-20 rounded-xl font-bold" 
                        defaultValue={habit.plateau_days_required}
                        onBlur={(e) => onUpdateHabitField(habit.id, { plateau_days_required: parseInt(e.target.value) })}
                    />
                    <p className="text-[10px] text-muted-foreground leading-snug">
                        Days of 100% consistency required before the system suggests a goal increase.
                    </p>
                </div>
             </div>

             <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Dependent On</Label>
                <Select 
                  value={habit.dependent_on_habit_id || 'none'} 
                  onValueChange={(value) => onUpdateHabitField(habit.id, { dependent_on_habit_id: value === 'none' ? null : value })}
                >
                  <SelectTrigger className="h-11 rounded-xl font-bold text-base">
                    <SelectValue placeholder="No dependency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No dependency</SelectItem>
                    {otherHabits.map(otherHabit => (
                      <SelectItem key={otherHabit.id} value={otherHabit.id}>
                        {otherHabit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  This habit will be marked as "locked" until the dependent habit is completed for the day.
                </p>
             </div>
          </TabsContent>
        </Tabs>
      </AccordionContent>
    </AccordionItem>
  );
};