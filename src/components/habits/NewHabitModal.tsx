"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Target, Anchor, Brain, Clock, Layers,
  Plus, Loader2, Info, X, LayoutTemplate, Zap
} from 'lucide-react';
import { habitCategories, habitUnits, habitModes, habitIcons, habitMeasurementTypes, HabitTemplate } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { UserHabitRecord, HabitCategory as HabitCategoryType, MeasurementType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useCreateTemplate, CreateTemplateParams } from '@/hooks/useCreateTemplate';

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToPreFill?: HabitTemplate | null;
  isTemplateMode?: boolean;
}

export interface CreateHabitParams {
  name: string;
  habit_key: string;
  category: HabitCategoryType;
  current_daily_goal: number;
  frequency_per_week: number;
  is_trial_mode: boolean;
  is_fixed: boolean;
  anchor_practice: boolean;
  auto_chunking: boolean;
  unit: 'min' | 'reps' | 'dose';
  measurement_type: MeasurementType; // Added
  xp_per_unit: number;
  energy_cost_per_unit: number;
  icon_name: string;
  dependent_on_habit_id: string | null;
  plateau_days_required: number;
  window_start: string | null;
  window_end: string | null;
  carryover_enabled: boolean;
  short_description?: string;
}

const createNewHabit = async ({ userId, habit, neurodivergentMode }: { userId: string; habit: CreateHabitParams; neurodivergentMode: boolean }) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  const { name, habit_key, category, current_daily_goal, frequency_per_week, is_trial_mode, is_fixed, anchor_practice, auto_chunking, unit, measurement_type, xp_per_unit, energy_cost_per_unit, icon_name, dependent_on_habit_id, window_start, window_end, carryover_enabled } = habit;

  let calculatedPlateauDays = habit.plateau_days_required;
  if (is_trial_mode) {
    calculatedPlateauDays = neurodivergentMode ? 14 : 7;
  } else if (is_fixed) {
    calculatedPlateauDays = 7;
  } else {
    calculatedPlateauDays = neurodivergentMode ? 10 : 5;
  }

  let numChunks = 1;
  let chunkDuration = current_daily_goal;
  if (auto_chunking && measurement_type === 'timer' && current_daily_goal > (neurodivergentMode ? 5 : 10)) {
    const targetChunkSize = neurodivergentMode ? 5 : 10;
    numChunks = Math.max(1, Math.ceil(current_daily_goal / targetChunkSize));
    chunkDuration = Number((current_daily_goal / numChunks).toFixed(1));
  }

  const roundedCurrentDailyGoal = Math.round(current_daily_goal);
  const roundedFrequencyPerWeek = Math.round(frequency_per_week);
  const roundedXpPerUnit = Math.round(xp_per_unit);
  const roundedPlateauDaysRequired = Math.round(calculatedPlateauDays);
  const roundedLongTermGoal = Math.round(current_daily_goal * (unit === 'min' ? 365 * 60 : 365));
  const roundedNumChunks = Math.round(numChunks);
  const roundedLifetimeProgress = Math.round(0);

  const finalDependentOnHabitId = dependent_on_habit_id === '' ? null : dependent_on_habit_id;
  const finalWindowStart = window_start === 'none' ? null : window_start;
  const finalWindowEnd = window_end === 'none' ? null : window_end;

  const { error } = await supabase.rpc('upsert_user_habit', {
    p_user_id: userId,
    p_habit_key: habit_key,
    p_name: name,
    p_category: category,
    p_current_daily_goal: roundedCurrentDailyGoal,
    p_frequency_per_week: roundedFrequencyPerWeek,
    p_is_trial_mode: is_trial_mode,
    p_is_fixed: is_fixed,
    p_anchor_practice: anchor_practice,
    p_auto_chunking: auto_chunking,
    p_unit: unit,
    p_measurement_type: measurement_type, // Added
    p_xp_per_unit: roundedXpPerUnit,
    p_energy_cost_per_unit: energy_cost_per_unit,
    p_icon_name: icon_name,
    p_dependent_on_habit_id: finalDependentOnHabitId,
    p_plateau_days_required: roundedPlateauDaysRequired,
    p_window_start: finalWindowStart,
    p_window_end: finalWindowEnd,
    p_carryover_enabled: carryover_enabled,
    p_long_term_goal: roundedLongTermGoal,
    p_target_completion_date: oneYearDateString,
    p_momentum_level: 'Building',
    p_lifetime_progress: roundedLifetimeProgress,
    p_last_goal_increase_date: today.toISOString().split('T')[0],
    p_is_frozen: false,
    p_max_goal_cap: null,
    p_last_plateau_start_date: today.toISOString().split('T')[0],
    p_completions_in_plateau: 0,
    p_growth_phase: 'duration',
    p_days_of_week: [0, 1, 2, 3, 4, 5, 6],
    p_enable_chunks: auto_chunking,
    p_num_chunks: roundedNumChunks,
    p_chunk_duration: chunkDuration,
    p_is_visible: true,
  });

  if (error) throw error;
  return { success: true };
};

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

export const NewHabitModal: React.FC<NewHabitModalProps> = ({ isOpen, onClose, templateToPreFill, isTemplateMode = false }) => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const [habitName, setHabitName] = useState('');
  const [habitKey, setHabitKey] = useState('');
  const [category, setCategory] = useState<HabitCategoryType>('daily');
  const [dailyGoal, setDailyGoal] = useState(15);
  const [frequency, setFrequency] = useState(3);
  const [isTrialMode, setIsTrialMode] = useState(true);
  const [isFixed, setIsFixed] = useState(false);
  const [isAnchorPractice, setIsAnchorPractice] = useState(false);
  const [autoChunking, setAutoChunking] = useState(true);
  const [unit, setUnit] = useState<'min' | 'reps' | 'dose'>('min');
  const [measurementType, setMeasurementType] = useState<MeasurementType>('timer'); // New state
  const [xpPerUnit, setXpPerUnit] = useState(30);
  const [energyCostPerUnit, setEnergyCostPerUnit] = useState(6);
  const [selectedIconName, setSelectedIconName] = useState<string>('Target');
  const [dependentOnHabitId, setDependentOnHabitId] = useState<string | null>(null);
  const [plateauDaysRequired, setPlateauDaysRequired] = useState(7);
  const [windowStart, setWindowStart] = useState<string | null>(null);
  const [windowEnd, setWindowEnd] = useState<string | null>(null);
  const [carryoverEnabled, setCarryoverEnabled] = useState(false);
  const [shortDescription, setShortDescription] = useState('');

  useEffect(() => {
    if (templateToPreFill) {
      setHabitName(templateToPreFill.name);
      setHabitKey(templateToPreFill.id);
      setCategory(templateToPreFill.category);
      setDailyGoal(templateToPreFill.defaultDuration);
      setFrequency(templateToPreFill.defaultFrequency);
      setIsTrialMode(templateToPreFill.defaultMode === 'Trial');
      setIsFixed(templateToPreFill.defaultMode === 'Fixed');
      setIsAnchorPractice(templateToPreFill.anchorPractice);
      setAutoChunking(templateToPreFill.autoChunking);
      setUnit(templateToPreFill.unit);
      setMeasurementType(templateToPreFill.measurement_type || (templateToPreFill.unit === 'min' ? 'timer' : 'unit'));
      setXpPerUnit(templateToPreFill.xpPerUnit);
      setEnergyCostPerUnit(templateToPreFill.energyCostPerUnit);
      setSelectedIconName(templateToPreFill.icon_name);
      setPlateauDaysRequired(templateToPreFill.plateauDaysRequired);
      setShortDescription(templateToPreFill.shortDescription || '');
    } else {
      setHabitName('');
      setHabitKey('');
      setCategory('daily');
      setDailyGoal(15);
      setFrequency(3);
      setIsTrialMode(true);
      setIsFixed(false);
      setIsAnchorPractice(false);
      setAutoChunking(true);
      setUnit('min');
      setMeasurementType('timer');
      setXpPerUnit(30);
      setEnergyCostPerUnit(6);
      setSelectedIconName('Target');
      setDependentOnHabitId(null);
      setPlateauDaysRequired(7);
      setWindowStart(null);
      setWindowEnd(null);
      setCarryoverEnabled(false);
      setShortDescription('');
    }
  }, [templateToPreFill, isOpen]);

  useEffect(() => {
    if (!templateToPreFill && habitName) {
      const key = habitName.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
      setHabitKey(key);
    }
  }, [habitName, templateToPreFill]);

  const createHabitMutation = useMutation({
    mutationFn: (habit: CreateHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createNewHabit({ userId: session.user.id, habit, neurodivergentMode });
    },
    onSuccess: () => {
      showSuccess('Habit created successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      onClose();
    },
  });

  const createTemplateMutation = useCreateTemplate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const habitData: CreateHabitParams = {
      name: habitName,
      habit_key: habitKey,
      category,
      current_daily_goal: dailyGoal,
      frequency_per_week: frequency,
      is_trial_mode: isTrialMode,
      is_fixed: isFixed,
      anchor_practice: isAnchorPractice,
      auto_chunking: autoChunking,
      unit,
      measurement_type: measurementType, // Added
      xp_per_unit: xpPerUnit,
      energy_cost_per_unit: energyCostPerUnit,
      icon_name: selectedIconName,
      dependent_on_habit_id: dependentOnHabitId,
      plateau_days_required: plateauDaysRequired,
      window_start: windowStart,
      window_end: windowEnd,
      carryover_enabled: carryoverEnabled,
      short_description: shortDescription,
    };

    if (isTemplateMode) {
      createTemplateMutation.mutate({
        id: habitData.habit_key,
        name: habitData.name,
        category: habitData.category,
        default_frequency: habitData.frequency_per_week,
        default_duration: habitData.current_daily_goal,
        default_mode: habitData.is_fixed ? 'Fixed' : (habitData.is_trial_mode ? 'Trial' : 'Growth'),
        default_chunks: 1,
        auto_chunking: habitData.auto_chunking,
        anchor_practice: habitData.anchor_practice,
        unit: habitData.unit,
        measurement_type: habitData.measurement_type, // Added
        xp_per_unit: habitData.xp_per_unit,
        energy_cost_per_unit: habitData.energy_cost_per_unit,
        icon_name: habitData.icon_name,
        plateau_days_required: habitData.plateau_days_required,
        short_description: habitData.short_description || '',
        is_public: true,
      });
    } else {
      createHabitMutation.mutate(habitData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="sticky top-0 bg-background/95 backdrop-blur-sm p-6 border-b z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {isTemplateMode ? <LayoutTemplate className="w-6 h-6" /> : <Target className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{isTemplateMode ? 'Contribute Template' : 'Create Habit'}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">Explicitly define how you measure success.</DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Core Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="habitName">Name *</Label>
                <Input id="habitName" value={habitName} onChange={(e) => setHabitName(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="habitKey">Unique ID *</Label>
                <Input id="habitKey" value={habitKey} onChange={(e) => setHabitKey(e.target.value)} required className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Measurement Mode</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {habitMeasurementTypes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMeasurementType(m.value)}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all",
                      measurementType === m.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                    )}
                  >
                    <p className="text-xs font-black uppercase">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{m.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={(v: 'min' | 'reps' | 'dose') => setUnit(v)}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{habitUnits.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Goal *</Label>
                <Input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} required className="h-12 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold" disabled={createHabitMutation.isPending || createTemplateMutation.isPending}>
              {createHabitMutation.isPending || createTemplateMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};