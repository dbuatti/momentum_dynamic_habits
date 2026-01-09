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
  Plus, Loader2, Info, X, LayoutTemplate, Zap,
  Percent, Hash
} from 'lucide-react';
import { habitCategories, habitUnits, habitModes, habitIcons, habitMeasurementTypes, HabitTemplate } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { UserHabitRecord, HabitCategory as HabitCategoryType, MeasurementType, GrowthType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useCreateTemplate, CreateTemplateParams } from '@/hooks/useCreateTemplate';
import { CreateHabitParams } from '@/pages/HabitWizard';
import { timeOptions } from '@/utils/time-utils'; // Import from new utility

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToPreFill?: HabitTemplate;
  isTemplateMode?: boolean;
}

const createNewHabit = async ({ userId, habit, neurodivergentMode }: { userId: string; habit: CreateHabitParams; neurodivergentMode: boolean }) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  const { 
    name, habit_key, category, current_daily_goal, frequency_per_week, 
    is_trial_mode, is_fixed, anchor_practice, auto_chunking, enable_chunks,
    chunking_mode, preferred_chunk_duration, preferred_chunk_count,
    unit, measurement_type, xp_per_unit, energy_cost_per_unit, icon_name, 
    dependent_on_habit_id, window_start, window_end, carryover_enabled,
    growth_type, growth_value, weekly_session_min_duration,
    complete_on_finish, is_weekly_goal
  } = habit;

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
  if (auto_chunking && unit === 'min' && current_daily_goal > (neurodivergentMode ? 5 : 10)) {
    const targetChunkSize = neurodivergentMode ? 5 : 10;
    numChunks = Math.max(1, Math.ceil(current_daily_goal / targetChunkSize));
    chunkDuration = Number((current_daily_goal / numChunks).toFixed(1));
  } else if (auto_chunking && unit === 'reps' && current_daily_goal > (neurodivergentMode ? 10 : 20)) {
    const targetChunkSize = neurodivergentMode ? 10 : 20;
    numChunks = Math.max(1, Math.ceil(current_daily_goal / targetChunkSize));
    chunkDuration = Number((current_daily_goal / numChunks).toFixed(1));
  }

  const { error } = await supabase.rpc('upsert_user_habit', {
    p_user_id: userId,
    p_habit_key: habit_key,
    p_name: name,
    p_category: category,
    p_current_daily_goal: Math.round(current_daily_goal),
    p_frequency_per_week: Math.round(frequency_per_week),
    p_is_trial_mode: is_trial_mode,
    p_is_fixed: is_fixed,
    p_anchor_practice: anchor_practice,
    p_auto_chunking: auto_chunking,
    p_unit: unit,
    p_xp_per_unit: Math.round(xp_per_unit),
    p_energy_cost_per_unit: energy_cost_per_unit,
    p_icon_name: icon_name,
    p_dependent_on_habit_id: dependent_on_habit_id === '' ? null : dependent_on_habit_id,
    p_plateau_days_required: Math.round(calculatedPlateauDays),
    p_window_start: window_start === 'none' ? null : window_start,
    p_window_end: window_end === 'none' ? null : window_end,
    p_carryover_enabled: carryover_enabled,
    p_long_term_goal: Math.round(current_daily_goal * (unit === 'min' ? 365 * 60 : 365)),
    p_target_completion_date: oneYearDateString,
    p_momentum_level: 'Building',
    p_lifetime_progress: 0,
    p_last_goal_increase_date: today.toISOString().split('T')[0],
    p_is_frozen: false,
    p_max_goal_cap: null,
    p_last_plateau_start_date: today.toISOString().split('T')[0],
    p_completions_in_plateau: 0,
    p_growth_phase: 'duration',
    p_days_of_week: [0, 1, 2, 3, 4, 5, 6],
    p_enable_chunks: enable_chunks,
    p_num_chunks: Math.round(numChunks),
    p_chunk_duration: chunkDuration,
    p_is_visible: true,
    p_measurement_type: measurement_type,
    p_growth_type: growth_type,
    p_growth_value: growth_value,
    p_weekly_session_min_duration: Math.round(weekly_session_min_duration),
    p_complete_on_finish: complete_on_finish,
    p_is_weekly_goal: is_weekly_goal,
  });

  if (error) throw error;
  return { success: true };
};

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
  const [measurementType, setMeasurementType] = useState<MeasurementType>('timer');
  const [xpPerUnit, setXpPerUnit] = useState(30);
  const [energyCostPerUnit, setEnergyCostPerUnit] = useState(6);
  const [selectedIconName, setSelectedIconName] = useState<string>('Target');
  const [dependentOnHabitId, setDependentOnHabitId] = useState<string | null>(null);
  const [plateauDaysRequired, setPlateauDaysRequired] = useState(7);
  const [windowStart, setWindowStart] = useState<string | null>(null);
  const [windowEnd, setWindowEnd] = useState<string | null>(null);
  const [carryoverEnabled, setCarryoverEnabled] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [growthType, setGrowthType] = useState<GrowthType>('percentage');
  const [growthValue, setGrowthValue] = useState(10);
  const [weeklySessionMinDuration, setWeeklySessionMinDuration] = useState(10);
  const [completeOnFinish, setCompleteOnFinish] = useState(true);
  const [isWeeklyGoal, setIsWeeklyGoal] = useState(false);

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
      setWeeklySessionMinDuration(templateToPreFill.defaultDuration);
      setCompleteOnFinish(true);
      setIsWeeklyGoal(false);
      
      if (templateToPreFill.unit === 'min') {
        setGrowthType('percentage');
        setGrowthValue(neurodivergentMode ? 10 : 20);
      } else {
        setGrowthType('fixed');
        setGrowthValue(neurodivergentMode ? 1 : 2);
      }
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
      setGrowthType('percentage');
      setGrowthValue(10);
      setWeeklySessionMinDuration(10);
      setCompleteOnFinish(true);
      setIsWeeklyGoal(false);
    }
  }, [templateToPreFill, isOpen, neurodivergentMode]);

  const handleUnitChange = (newUnit: 'min' | 'reps' | 'dose') => {
    setUnit(newUnit);
    if (newUnit === 'min') {
      setGrowthType('percentage');
      setGrowthValue(neurodivergentMode ? 10 : 20);
      setMeasurementType('timer');
      setWeeklySessionMinDuration(dailyGoal);
    } else if (newUnit === 'reps') {
      setGrowthType('fixed');
      setGrowthValue(neurodivergentMode ? 1 : 3);
      setMeasurementType('unit');
      setWeeklySessionMinDuration(dailyGoal);
    } else {
      setGrowthType('fixed');
      setGrowthValue(0);
      setMeasurementType('binary');
      setDailyGoal(1);
      setWeeklySessionMinDuration(1);
    }
  };

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
      enable_chunks: autoChunking,
      chunking_mode: 'auto',
      unit,
      measurement_type: measurementType,
      xp_per_unit: xpPerUnit,
      energy_cost_per_unit: energyCostPerUnit,
      icon_name: selectedIconName,
      dependent_on_habit_id: dependentOnHabitId,
      plateau_days_required: plateauDaysRequired,
      window_start: windowStart,
      window_end: windowEnd,
      carryover_enabled: carryoverEnabled,
      short_description: shortDescription,
      growth_type: growthType,
      growth_value: growthValue,
      weekly_session_min_duration: weeklySessionMinDuration,
      complete_on_finish: completeOnFinish,
      is_weekly_goal: isWeeklyGoal,
    };

    if (isTemplateMode) {
      createTemplateMutation.mutate({
        ...habitData,
        id: habitData.habit_key,
        default_frequency: habitData.frequency_per_week,
        default_duration: habitData.current_daily_goal,
        default_mode: habitData.is_fixed ? 'Fixed' : (habitData.is_trial_mode ? 'Trial' : 'Growth'),
        default_chunks: 1,
        is_public: true,
      } as any);
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
                <DialogDescription className="text-sm text-muted-foreground">Define how your habit evolves.</DialogDescription>
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
                <Input id="habitName" value={habitName} onChange={(e) => setHabitName(e.target.value)} required className="h-12 rounded-xl" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={(v: any) => handleUnitChange(v)}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{habitUnits.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Goal *</Label>
                <Input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Weekly Frequency *</Label>
                <Input type="number" min="1" max="7" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} required className="h-12 rounded-xl" />
              </div>
            </div>
          </div>

          {!isFixed && unit !== 'dose' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Growth Increments</h3>
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={growthType === 'percentage' ? 'default' : 'outline'}
                    className="flex-1 rounded-xl h-12"
                    onClick={() => setGrowthType('percentage')}
                    disabled={dailyGoal === 1}
                  >
                    <Percent className="w-4 h-4 mr-2" /> Percentage
                  </Button>
                  <Button
                    type="button"
                    variant={growthType === 'fixed' ? 'default' : 'outline'}
                    className="flex-1 rounded-xl h-12"
                    onClick={() => setGrowthType('fixed')}
                  >
                    <Hash className="w-4 h-4 mr-2" /> Fixed Value
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Increase by</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={growthValue}
                      onChange={(e) => setGrowthValue(Number(e.target.value))}
                      className="h-12 rounded-xl font-bold"
                    />
                    <span className="font-bold text-lg">
                      {growthType === 'percentage' ? '%' : unit}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {growthType === 'percentage' 
                      ? `Target will increase from ${dailyGoal} to ${Math.round(dailyGoal * (1 + growthValue / 100))} ${unit}`
                      : `Target will increase from ${dailyGoal} to ${dailyGoal + growthValue} ${unit}`
                    } after stability plateau.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold" disabled={createHabitMutation.isPending}>
              {createHabitMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};