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
  Percent, Hash, TrendingUp
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

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToPreFill?: HabitTemplate | null;
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
    weekly_goal_enabled, weekly_goal_target, weekly_goal_unit // NEW fields
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
    // NEW: Weekly goal fields
    p_weekly_goal_enabled: weekly_goal_enabled,
    p_weekly_goal_target: weekly_goal_target,
    p_weekly_goal_unit: weekly_goal_unit,
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
  // NEW: Weekly Goal State
  const [weeklyGoalEnabled, setWeeklyGoalEnabled] = useState(false);
  const [weeklyGoalTarget, setWeeklyGoalTarget] = useState(0);

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
      setWeeklySessionMinDuration(templateToPreFill.defaultDuration); // Initialize new field
      
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
      setWeeklySessionMinDuration(10); // Default for new habit
      // NEW: Reset weekly goal state
      setWeeklyGoalEnabled(false);
      setWeeklyGoalTarget(0);
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
    // NEW: Reset weekly goal target when unit changes
    setWeeklyGoalTarget(0);
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
      weekly_session_min_duration: weeklySessionMinDuration, // ADDED
      // NEW: Weekly goal fields
      weekly_goal_enabled: weeklyGoalEnabled,
      weekly_goal_target: weeklyGoalTarget,
      weekly_goal_unit: unit,
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
                <Input id="habitName" value={habitName} onChange={(e) => setHabitName(e.target.value)} required className="h-12 rounded-xl" />
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

          {/* NEW: Weekly Goal Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Weekly Goal</h3>
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Weekly Goal</Label>
                  <p className="text-xs text-muted-foreground">Track progress over the week instead of daily</p>
                </div>
                <Switch 
                  checked={weeklyGoalEnabled} 
                  onCheckedChange={setWeeklyGoalEnabled} 
                />
              </div>

              {weeklyGoalEnabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                  <Label>Weekly Target</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={weeklyGoalTarget}
                      onChange={(e) => setWeeklyGoalTarget(Number(e.target.value))}
                      className="h-12 rounded-xl font-bold"
                      min={1}
                      required={weeklyGoalEnabled}
                    />
                    <span className="font-bold text-lg">{unit} / week</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Example: 70 minutes per week for daily 10-minute reading.
                  </p>
                </div>
              )}
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
                      onChange={(e) => Adaptive Growth: Daily goal for ${userHabitData.name} increased to ${Math.round(newDailyGoal)} ${userHabitData.unit}!`);
          }
          
          newGrowthPhase = userHabitData.frequency_per_week < 7 ? 'frequency' : 'duration';
        }

        await supabase.from('user_habits').update({
          last_plateau_start_date: todayDateString,
          completions_in_plateau: 0, 
          last_goal_increase_date: todayDateString,
          current_daily_goal: Math.round(newDailyGoal),
          frequency_per_week: Math.round(newFrequency),
          growth_phase: newGrowthPhase,
          is_trial_mode: newIsTrialMode,
        }).eq('id', userHabitData.id);
      }
    } else {
      await supabase.from('user_habits').update({
        completions_in_plateau: Math.round(newCompletionsInPlateau),
        last_plateau_start_date: newLastPlateauStartDate,
        is_trial_mode: newIsTrialMode,
      }).eq('id', userHabitData.id);
    }
  }
  // --- END: Daily/Weekly Completion Logic Update ---

  const newXp = (profileData.xp || 0) + xpEarned;
  await supabase.from('profiles').update({
    last_active_at: new Date().toISOString(),
    tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
    xp: newXp,
    level: calculateLevel(newXp),
  }).eq('id', userId);

  return { success: true, taskName, xpEarned, completedTaskId: insertedTask.id };
};

const unlogHabit = async ({ userId, completedTaskId }: { userId: string, completedTaskId: string }) => {
  const { data: task, error: fetchTaskError } = await supabase
    .from('completedtasks')
    .select('*')
    .eq('id', completedTaskId)
    .eq('user_id', userId)
    .single();

  if (fetchTaskError || !task) throw fetchTaskError || new Error('Completed task not found');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('timezone, xp, tasks_completed_today')
    .eq('id', userId)
    .single();

  const timezone = profileData?.timezone || 'UTC';

  const { data: userHabitDataResult } = await supabase
    .from('user_habits')
    .select('id, unit, xp_per_unit, current_daily_goal, completions_in_plateau, last_plateau_start_date, carryover_value, measurement_type, weekly_session_min_duration, frequency_per_week, category, is_fixed, weekly_goal_enabled, weekly_goal_target') // ADDED weekly_goal_enabled, weekly_goal_target
    .eq('user_id', userId)
    .eq('habit_key', task.original_source)
    .single();

  if (!userHabitDataResult) throw new Error(`Habit data not found for key: ${task.original_source}`);
  const userHabitData = userHabitDataResult;
  const xpPerUnit = userHabitData.xp_per_unit || (userHabitData.unit === 'min' ? 30 : 1);

  let lifetimeProgressDecrementValue;
  if (userHabitData.measurement_type === 'timer') {
    lifetimeProgressDecrementValue = task.duration_used || 0;
  } else {
    lifetimeProgressDecrementValue = (task.xp_earned || 0) / xpPerUnit; 
  }

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: task.original_source, p_increment_value: -Math.round(lifetimeProgressDecrementValue),
  });

  if (profileData) {
    const newXp = Math.max(0, (profileData.xp || 0) - (task.xp_earned || 0));
    await supabase.from('profiles').update({
      xp: newXp,
      level: calculateLevel(newXp),
      tasks_completed_today: Math.max(0, (profileData.tasks_completed_today || 0) - 1)
    }).eq('id', userId);
  }

  await supabase.from('completedtasks').delete().eq('id', completedTaskId);

  // --- START: Re-evaluate completion status after unlog ---
  
  const isWeeklyAnchor = userHabitData.category === 'anchor' && userHabitData.frequency_per_week === 1;
  const isWeeklyGoal = userHabitData.weekly_goal_enabled;
  
  const { data: completedTodayAfterUnlog } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, p_timezone: timezone 
  });
  
  // Get weekly progress for this habit (after unlog)
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const { data: completedThisWeekAfterUnlog } = await supabase
    .from('completedtasks')
    .select('duration_used, xp_earned')
    .eq('user_id', userId)
    .eq('original_source', task.original_source)
    .gte('completed_at', weekStart.toISOString())
    .lte('completed_at', weekEnd.toISOString());

  let totalDailyProgressAfterUnlog = 0;
  let totalWeeklyProgressAfterUnlog = 0;
  let isGoalMetAfterUnlog = false;

  // Calculate weekly progress after unlog
  let weeklyProgress = 0;
  (completedThisWeekAfterUnlog || []).forEach(t => {
    if (userHabitData.measurement_type === 'timer') {
      weeklyProgress += (t.duration_used || 0) / 60;
    } else {
      weeklyProgress += (t.xp_earned || 0) / xpPerUnit;
    }
  });
  totalWeeklyProgressAfterUnlog = weeklyProgress;

  if (isWeeklyGoal) {
    const threshold = userHabitData.measurement_type === 'timer' ? 0.1 : 0.01;
    isGoalMetAfterUnlog = weeklyProgress >= (userHabitData.weekly_goal_target - threshold);
  } else if (isWeeklyAnchor) {
    // For weekly anchors, we check if ANY remaining session meets the minimum duration.
    const minDuration = userHabitData.weekly_session_min_duration || 10;
    
    const remainingSessionsToday = (completedTodayAfterUnlog || [])
      .filter((t: any) => t.original_source === task.original_source && t.duration_used && (t.duration_used / 60) >= minDuration);
      
    // If there is at least one remaining session that meets the minimum, the goal is still considered met for plateau logic.
    isGoalMetAfterUnlog = remainingSessionsToday.length > 0;
    totalDailyProgressAfterUnlog = remainingSessionsToday.length > 0 ? remainingSessionsToday[0].duration_used / 60 : 0; // Arbitrarily use first remaining session's duration for progress tracking if needed
  } else {
    // Standard Daily Habit Logic
    let totalDailySeconds = 0;
    let totalDailyUnits = 0;

    (completedTodayAfterUnlog || []).filter((t: any) => t.original_source === task.original_source).forEach((t: any) => {
      if (userHabitData.measurement_type === 'timer') {
        totalDailySeconds += (t.duration_used || 0);
      } else if (userHabitData.measurement_type === 'unit' || userHabitData.measurement_type === 'binary') {
        totalDailyUnits += (t.xp_earned || 0) / xpPerUnit;
      } else {
        totalDailyUnits += 1;
      }
    });

    totalDailyProgressAfterUnlog = userHabitData.measurement_type === 'timer' 
      ? totalDailySeconds / 60 
      : totalDailyUnits;

    const threshold = userHabitData.measurement_type === 'timer' ? 0.1 : 0.01;
    isGoalMetAfterUnlog = totalDailyProgressAfterUnlog >= (userHabitData.current_daily_goal - threshold);
  }

  // Carryover Logic (Only applies to non-binary, non-fixed, non-weekly-goal habits)
  if (userHabitData.measurement_type !== 'binary' && !userHabitData.is_fixed && !isWeeklyGoal) {
    const surplusAfterUnlog = totalDailyProgressAfterUnlog - userHabitData.current_daily_goal;
    const newCarryoverValueAfterUnlog = Math.max(0, surplusAfterUnlog);
    await supabase.from('user_habits').update({
      carryover_value: newCarryoverValueAfterUnlog,
    }).eq('id', userHabitData.id);
  }

  // Plateau/Growth Logic: Decrement completions if goal is no longer met today
  if (!isGoalMetAfterUnlog && userHabitData.completions_in_plateau > 0) {
    await supabase.from('user_habits').update({
      completions_in_plateau: Math.round(userHabitData.completions_in_plateau - 1),
    }).eq('id', userHabitData.id);
  }
  // --- END: Re-evaluate completion status after unlog ---

  return { success: true };
};

export const useHabitLog = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: (params: LogHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return logHabit({ ...params, userId: session.user.id });
    },
    onSuccess: async (data) => { // Added async here
      showSuccess(`${data.taskName} completed! +${data.xpEarned} XP`);
      await queryClient.refetchQueries({ queryKey: ['dashboardData', session?.user?.id] }); // Explicit refetch
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', session?.user?.id] }); // Invalidate completedTasks
      return data.completedTaskId;
    },
    onError: (error) => {
      showError(`Failed: ${error.message}`);
    },
  });

  const unlogMutation = useMutation({
    mutationFn: (params: { completedTaskId: string }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return unlogHabit({ ...params, userId: session.user.id });
    },
    onSuccess: async () => { // Added async here
      showSuccess('Task uncompleted.');
      await queryClient.refetchQueries({ queryKey: ['dashboardData', session?.user?.id] }); // Explicit refetch
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', session?.user?.id] }); // Invalidate completedTasks
    },
    onError: (error) => {
      showError(`Failed to uncomplete: ${error.message}`);
    },
  });

  return {
    mutate: logMutation.mutateAsync,
    isPending: logMutation.isPending,
    unlog: unlogMutation.mutate,
    isUnlogging: unlogMutation.isPending,
  };
};