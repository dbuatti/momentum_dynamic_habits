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
  Home, Code, Pill, Timer, BarChart3, Layers, Zap, Info, Eye, EyeOff, Link as LinkIcon, FlaskConical,
  Trash2, ChevronDown, ChevronUp, CheckCircle2, ListOrdered
} from 'lucide-react';
import { UserHabitRecord, MeasurementType, ChunkingMode } from '@/types/habit';
import { useUpdateHabitVisibility } from '@/hooks/useUpdateHabitVisibility';
import { habitIcons, habitModes, habitUnits, habitMeasurementTypes } from '@/lib/habit-templates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJourneyData } from '@/hooks/useJourneyData';
import { habitIconMap } from '@/lib/habit-utils';
import { useDeleteHabit } from '@/hooks/useDeleteHabit';
import { calculateDynamicChunks } from '@/utils/progress-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HabitSettingsCardProps {
  habit: UserHabitRecord;
  onUpdateHabitField: (habitId: string, updates: any) => Promise<void>;
  onToggleDay: (habitId: string, currentDays: number[], dayIndex: number) => void;
  isActiveHabit: boolean;
}

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const HabitSettingsCard: React.FC<HabitSettingsCardProps> = ({
  habit,
  onUpdateHabitField,
  onToggleDay,
  isActiveHabit,
}) => {
  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;
  const { mutate: deleteHabit, isPending: isDeletingHabit } = useDeleteHabit();

  const [editedHabitName, setEditedHabitName] = useState(habit.name || habit.habit_key.replace(/_/g, ' '));
  const [minDuration, setMinDuration] = useState(habit.weekly_session_min_duration || 10); // New state

  useEffect(() => {
    setEditedHabitName(habit.name || habit.habit_key.replace(/_/g, ' '));
  }, [habit.name, habit.habit_key]);
  
  useEffect(() => {
    setMinDuration(habit.weekly_session_min_duration || 10);
  }, [habit.weekly_session_min_duration]);

  const handleDeleteHabit = () => {
    deleteHabit({ habitId: habit.id, habitKey: habit.habit_key });
  };

  const handleUnitChange = (newUnit: 'min' | 'reps' | 'dose') => {
    const updates: any = { unit: newUnit };
    if (newUnit === 'dose') {
      updates.measurement_type = 'binary';
      updates.current_daily_goal = 1;
      updates.enable_chunks = false;
    } else if (newUnit === 'min') {
      updates.measurement_type = 'timer';
    } else if (newUnit === 'reps') {
      updates.measurement_type = 'unit';
    }
    onUpdateHabitField(habit.id, updates);
  };

  const handleMinDurationBlur = () => {
    if (minDuration !== habit.weekly_session_min_duration) {
      onUpdateHabitField(habit.id, { weekly_session_min_duration: Math.round(minDuration) });
    }
  };

  // Preview the calculated chunks
  const chunkPreview = useMemo(() => {
    return calculateDynamicChunks(
      habit.habit_key,
      habit.current_daily_goal,
      habit.unit,
      neurodivergentMode,
      habit.auto_chunking,
      habit.enable_chunks,
      habit.num_chunks,
      habit.chunk_duration,
      habit.measurement_type,
      habit.chunking_mode || 'auto',
      habit.preferred_chunk_duration,
      habit.preferred_chunk_count
    );
  }, [habit, neurodivergentMode]);

  const durationOptions = habit.unit === 'min' ? [5, 10, 15, 20, 30, 45, 60] : [5, 10, 20, 25, 50];
  const countOptions = [2, 3, 4, 5, 6, 8, 10, 12];
  
  const isWeeklyAnchor = habit.category === 'anchor' && habit.frequency_per_week === 1;

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
              <Input
                value={editedHabitName}
                onChange={(e) => setEditedHabitName(e.target.value)}
                onBlur={() => {
                  if (editedHabitName.trim() !== (habit.name || habit.habit_key.replace(/_/g, ' ')).trim()) {
                    onUpdateHabitField(habit.id, { name: editedHabitName.trim() });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
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
                   • {chunkPreview.numChunks} {chunkPreview.numChunks === 1 ? 'Part' : 'Parts'}
                 </span>
              </div>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-6 pb-8 pt-2">
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="basics" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Basics</TabsTrigger>
            <TabsTrigger value="schedule" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Schedule</TabsTrigger>
            <TabsTrigger value="advanced" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Logic</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-2 gap-4 bg-primary/[0.03] p-4 rounded-2xl border border-primary/10">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Daily Target</Label>
                 <div className="relative flex items-center gap-2">
                   <Input 
                     type="number" 
                     className="h-11 rounded-xl font-bold text-base flex-grow" 
                     defaultValue={habit.current_daily_goal} 
                     onBlur={(e) => onUpdateHabitField(habit.id, { current_daily_goal: Math.round(parseInt(e.target.value)) })}
                   />
                   <Select value={habit.unit} onValueChange={(v: any) => handleUnitChange(v)}>
                     <SelectTrigger className="h-11 w-[100px] rounded-xl font-bold text-base"><SelectValue /></SelectTrigger>
                     <SelectContent>{habitUnits.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
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
                    onBlur={(e) => onUpdateHabitField(habit.id, { frequency_per_week: Math.round(parseInt(e.target.value)) })}
                  />
               </div>
            </div>
            
            {isWeeklyAnchor && habit.unit === 'min' && (
              <div className="space-y-2 bg-info-background/50 p-4 rounded-2xl border border-info-border/50">
                <Label className="text-[10px] font-black uppercase opacity-60 ml-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Minimum Session Duration (min)
                </Label>
                <Input 
                  type="number" 
                  min="1" 
                  className="h-11 rounded-xl font-bold text-base" 
                  value={minDuration}
                  onChange={(e) => setMinDuration(Number(e.target.value))}
                  onBlur={handleMinDurationBlur}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  A session must be at least this long to count as 1 completed weekly session.
                </p>
              </div>
            )}

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
                        : "border-transparent bg-muted/30"
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

          <TabsContent value="schedule" className="space-y-6 focus-visible:outline-none">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Active Days</Label>
              <div className="flex justify-between bg-muted/30 p-2 rounded-2xl border border-border">
                {days.map((day, idx) => (
                  <Button
                    key={idx}
                    variant={habit.days_of_week?.includes(idx) ? "default" : "ghost"}
                    className={cn("h-10 w-10 rounded-xl font-black text-xs", habit.days_of_week?.includes(idx) && "shadow-md")}
                    onClick={() => onToggleDay(habit.id, habit.days_of_week || [], idx)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 focus-visible:outline-none">
             <div className="space-y-4">
               <div className="flex items-center gap-2 px-1">
                 <Layers className="w-4 h-4 text-primary" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">Modular Capsules (Chunking)</h3>
               </div>
               
               <div className="bg-muted/30 p-4 rounded-[2rem] border border-border space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <p className="text-sm font-bold">Enable Chunking</p>
                     <p className="text-[10px] text-muted-foreground">Break session into manageable parts.</p>
                   </div>
                   <Switch 
                     checked={habit.enable_chunks} 
                     onCheckedChange={(v) => onUpdateHabitField(habit.id, { enable_chunks: v })} 
                   />
                 </div>

                 {habit.enable_chunks && (
                   <div className="space-y-6 pt-4 border-t border-border">
                     <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">How would you like to break this up?</Label>
                       <div className="grid grid-cols-3 gap-2">
                         {[
                           { id: 'auto', label: 'Auto', icon: Sparkles },
                           { id: 'by_duration', label: 'Time', icon: Clock },
                           { id: 'by_parts', label: 'Steps', icon: ListOrdered }
                         ].map((m) => (
                           <Button
                             key={m.id}
                             variant={habit.chunking_mode === m.id ? "default" : "outline"}
                             className="h-10 rounded-xl text-[10px] font-bold uppercase gap-2"
                             onClick={() => onUpdateHabitField(habit.id, { chunking_mode: m.id })}
                           >
                             <m.icon className="w-3.5 h-3.5" /> {m.label}
                           </Button>
                         ))}
                       </div>
                     </div>

                     {habit.chunking_mode === 'by_duration' && (
                       <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Preferred Block Size</Label>
                         <div className="flex flex-wrap gap-2">
                           {durationOptions.map((d) => (
                             <Button
                               key={d}
                               variant={habit.preferred_chunk_duration === d ? "secondary" : "outline"}
                               className={cn("h-9 px-3 rounded-lg text-xs font-bold", habit.preferred_chunk_duration === d && "ring-2 ring-primary")}
                               onClick={() => onUpdateHabitField(habit.id, { preferred_chunk_duration: d })}
                             >
                               {d} {habit.unit}
                             </Button>
                           ))}
                         </div>
                       </div>
                     )}

                     {habit.chunking_mode === 'by_parts' && (
                       <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                         <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Number of Steps</Label>
                         <div className="flex flex-wrap gap-2">
                           {countOptions.map((c) => (
                             <Button
                               key={c}
                               variant={habit.preferred_chunk_count === c ? "secondary" : "outline"}
                               className={cn("h-9 px-4 rounded-lg text-xs font-bold", habit.preferred_chunk_count === c && "ring-2 ring-primary")}
                               onClick={() => onUpdateHabitField(habit.id, { preferred_chunk_count: c })}
                             >
                               {c}
                             </Button>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                       <div className="bg-primary/10 p-2 rounded-xl text-primary mt-1">
                         <Info className="w-4 h-4" />
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase text-primary/70 tracking-widest">Active Strategy</p>
                         <p className="text-sm font-bold text-foreground leading-tight">
                           This will create <span className="text-primary">{chunkPreview.numChunks} × {chunkPreview.chunkValue} {habit.unit}</span> parts for your {habit.current_daily_goal} {habit.unit} goal.
                         </p>
                         {habit.chunking_mode === 'auto' && (
                           <p className="text-[10px] text-muted-foreground italic">Human-centric defaults: focusing on sustainable momentum.</p>
                         )}
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>

             <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-3 mt-8">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full rounded-xl h-10" disabled={isDeletingHabit}>
                      <Trash2 className="w-4 h-4 mr-2" /> {isDeletingHabit ? 'Deleting...' : 'Delete Habit'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader><AlertDialogTitle>Confirm Delete</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteHabit} className="rounded-xl bg-destructive" disabled={isDeletingHabit}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
             </div>
          </TabsContent>
        </Tabs>
      </AccordionContent>
    </AccordionItem>
  );
};