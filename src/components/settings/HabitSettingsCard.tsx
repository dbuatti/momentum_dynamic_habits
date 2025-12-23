"use client";

import React, { useMemo, useState, useEffect } from 'react';
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
  Home, Code, Pill, Timer, BarChart3, Layers, Zap, Info, Eye, EyeOff, Link as LinkIcon, FlaskConical
} from 'lucide-react';
import { UserHabitRecord } from '@/types/habit';
import { useUpdateHabitVisibility } from '@/hooks/useUpdateHabitVisibility';
import { habitIcons, habitModes, habitUnits } from '@/lib/habit-templates'; // Import habitUnits
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJourneyData } from '@/hooks/useJourneyData';
import { habitIconMap } from '@/lib/habit-utils';

interface HabitSettingsCardProps {
  habit: UserHabitRecord;
  onUpdateHabitField: (habitId: string, updates: any) => Promise<void>;
  onToggleDay: (habitId: string, currentDays: number[], dayIndex: number) => void;
  isActiveHabit: boolean;
}

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

const getHabitIcon = (habitKey: string) => {
  return habitIconMap[habitKey] || habitIconMap.custom_habit;
};

export const HabitSettingsCard: React.FC<HabitSettingsCardProps> = ({
  habit,
  onUpdateHabitField,
  onToggleDay,
  isActiveHabit,
}) => {
  const Icon = getHabitIcon(habit.habit_key);
  const { mutate: updateHabitVisibility } = useUpdateHabitVisibility();
  const { data: journeyData } = useJourneyData();

  const habitUnit = habit.unit || '';

  const otherHabits = useMemo(() => {
    return (journeyData?.allHabits || []).filter(h => h.id !== habit.id);
  }, [journeyData?.allHabits, habit.id]);

  const selectedDependentHabit = useMemo(() => {
    if (!habit.dependent_on_habit_id) return null;
    return otherHabits.find(h => h.id === habit.dependent_on_habit_id);
  }, [habit.dependent_on_habit_id, otherHabits]);

  // State for editable habit name
  const [editedHabitName, setEditedHabitName] = useState(habit.name || habit.habit_key.replace(/_/g, ' '));

  // Effect to update editedHabitName if habit.name changes from outside (e.g., initial load or external update)
  useEffect(() => {
    setEditedHabitName(habit.name || habit.habit_key.replace(/_/g, ' '));
  }, [habit.name, habit.habit_key]);

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
              {/* Replaced h4 with Input */}
              <Input
                value={editedHabitName}
                onChange={(e) => setEditedHabitName(e.target.value)}
                onBlur={() => {
                  if (editedHabitName.trim() !== (habit.name || habit.habit_key.replace(/_/g, ' ')).trim()) {
                    onUpdateHabitField(habit.id, { name: editedHabitName.trim() });
                  }
                }}
                onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling when clicking input
                className="h-10 rounded-xl font-bold text-base bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0"
              />
              <div className="flex items-center gap-2 mt-0.5">
                 <span className={cn(
                   "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                   habit.is_fixed ? "bg-info-background text-info-foreground border-info-border" : 
                   habit.is_trial_mode ? "bg-warning-background text-warning-foreground border-warning-border" : 
                   "bg-success-background text-success-foreground border-success-border"
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
              <span>Depends on: {selectedDependentHabit?.name || 'Unknown Habit'}</span>
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
                 <div className="relative flex items-center gap-2"> {/* Added flex and gap */}
                   <Input 
                     type="number" 
                     className="pl-3 pr-3 h-11 rounded-xl font-bold text-base flex-grow" // Removed pr-12, added flex-grow
                     defaultValue={habit.current_daily_goal} 
                     onBlur={(e) => onUpdateHabitField(habit.id, { current_daily_goal: parseInt(e.target.value) })}
                   />
                   <Select 
                     value={habitUnit} 
                     onValueChange={(value) => onUpdateHabitField(habit.id, { unit: value })}
                   >
                     <SelectTrigger className="h-11 w-[100px] rounded-xl font-bold text-base">
                       <SelectValue placeholder="Unit" />
                     </SelectTrigger>
                     <SelectContent>
                       {habitUnits.map((u) => (
                         <SelectItem key={u.value} value={u.value}>
                           {u.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
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
              <div className="flex justify-between bg-muted/30 p-2 rounded-2xl border border-border">
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
                 <Select value={habit.window_start || ''} onValueChange={(value) => onUpdateHabitField(habit.id, { window_start: value || null })}>
                    <SelectTrigger id="windowStart" className="h-12 rounded-xl"><SelectValue placeholder="Anytime" /></SelectTrigger>
                    <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                 <div className="flex items-center gap-2 ml-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                 </div>
                 <Select value={habit.window_end || ''} onValueChange={(value) => onUpdateHabitField(habit.id, { window_end: value || null })}>
                    <SelectTrigger id="windowEnd" className="h-12 rounded-xl"><SelectValue placeholder="Anytime" /></SelectTrigger>
                    <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
            </div>
          </TabsContent>

          {/* LOGIC TAB: Visibility, Plateau, Chunking */}
          <TabsContent value="advanced" className="space-y-4 focus-visible:outline-none">
             <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex gap-4">
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <Anchor className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Anchor Practice</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Prioritize this habit on your dashboard.</p>
                  </div>
                </div>
                <Switch 
                  checked={habit.anchor_practice} 
                  onCheckedChange={(v) => onUpdateHabitField(habit.id, { anchor_practice: v })} 
                />
             </div>

             <div className="flex items-center justify-between p-4 rounded-2xl bg-info-background/50 border border-info-border/50">
                <div className="flex gap-4">
                  <div className="bg-info-background/50 p-2 rounded-xl">
                    <Layers className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Adaptive Auto-Chunking</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Automagically break sessions into capsules.</p>
                  </div>
                </div>
                <Switch 
                  checked={habit.auto_chunking} 
                  onCheckedChange={(v) => onUpdateHabitField(habit.id, { auto_chunking: v, enable_chunks: v })} 
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

             <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
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
                    <SelectValue placeholder="No dependency">
                      {selectedDependentHabit ? selectedDependentHabit.name : "No dependency"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No dependency</SelectItem>
                    {otherHabits.map(otherHabit => (
                      <SelectItem key={otherHabit.id} value={otherHabit.id}>
                        {otherHabit.name || otherHabit.habit_key.replace(/_/g, ' ')}
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