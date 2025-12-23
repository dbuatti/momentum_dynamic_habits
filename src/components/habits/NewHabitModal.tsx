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
import { habitCategories, habitUnits, habitModes, habitIcons, HabitTemplate } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { UserHabitRecord, HabitCategory as HabitCategoryType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useCreateTemplate, CreateTemplateParams } from '@/hooks/useCreateTemplate'; // Import CreateTemplateParams

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToPreFill?: HabitTemplate | null;
  isTemplateMode?: boolean; // New prop to indicate template creation mode
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
  xp_per_unit: number;
  energy_cost_per_unit: number;
  icon_name: string;
  dependent_on_habit_id: string | null;
  plateau_days_required: number;
  window_start: string | null;
  window_end: string | null;
  carryover_enabled: boolean; // Added carryover_enabled
  short_description?: string; // For templates
}

const createNewHabit = async ({ userId, habit, neurodivergentMode }: { userId: string; habit: CreateHabitParams; neurodivergentMode: boolean }) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  const { name, habit_key, category, current_daily_goal, frequency_per_week, is_trial_mode, is_fixed, anchor_practice, auto_chunking, unit, xp_per_unit, energy_cost_per_unit, icon_name, dependent_on_habit_id, window_start, window_end, carryover_enabled } = habit;

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

  const habitToInsert: Partial<UserHabitRecord> = {
    user_id: userId,
    habit_key: habit_key,
    name: name,
    unit: unit,
    xp_per_unit: xp_per_unit,
    energy_cost_per_unit: energy_cost_per_unit,
    current_daily_goal: current_daily_goal,
    long_term_goal: current_daily_goal * (unit === 'min' ? 365 * 60 : 365),
    target_completion_date: oneYearDateString,
    momentum_level: 'Building',
    lifetime_progress: 0,
    last_goal_increase_date: today.toISOString().split('T')[0],
    is_frozen: false,
    max_goal_cap: null,
    last_plateau_start_date: today.toISOString().split('T')[0],
    plateau_days_required: calculatedPlateauDays,
    completions_in_plateau: 0,
    is_fixed: is_fixed,
    category: category,
    is_trial_mode: is_trial_mode,
    frequency_per_week: frequency_per_week,
    growth_phase: 'duration',
    window_start: window_start,
    window_end: window_end,
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    auto_chunking: auto_chunking,
    enable_chunks: auto_chunking,
    num_chunks: numChunks,
    chunk_duration: chunkDuration,
    is_visible: true,
    dependent_on_habit_id: dependent_on_habit_id,
    anchor_practice: anchor_practice,
    carryover_value: carryover_enabled ? 1 : 0,
  };

  // Remove the onConflict option. The client handles upserts based on primary key or unique constraints.
  const { error } = await supabase.from('user_habits').upsert(habitToInsert);

  if (error) throw error;
  return { success: true };
};

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

const getHabitIconComponent = (iconName: string) => {
  return habitIcons.find(i => i.value === iconName)?.icon || Target;
};

export const NewHabitModal: React.FC<NewHabitModalProps> = ({ isOpen, onClose, templateToPreFill, isTemplateMode = false }) => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  // Form state
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
  const [xpPerUnit, setXpPerUnit] = useState(30);
  const [energyCostPerUnit, setEnergyCostPerUnit] = useState(6);
  const [selectedIconName, setSelectedIconName] = useState<string>('Target');
  const [dependentOnHabitId, setDependentOnHabitId] = useState<string | null>(null);
  const [plateauDaysRequired, setPlateauDaysRequired] = useState(7);
  const [windowStart, setWindowStart] = useState<string | null>(null);
  const [windowEnd, setWindowEnd] = useState<string | null>(null);
  const [carryoverEnabled, setCarryoverEnabled] = useState(false); // New state for carryover
  const [shortDescription, setShortDescription] = useState(''); // For templates

  // Calculate estimated weekly total
  const estimatedWeeklyTotal = useMemo(() => dailyGoal * frequency, [dailyGoal, frequency]);

  // Get other habits for dependency dropdown
  const otherHabits = useMemo(() => {
    return (journeyData?.allHabits || []).filter(h => h.habit_key !== habitKey);
  }, [journeyData?.allHabits, habitKey]);

  const selectedDependentHabit = useMemo(() => {
    if (!dependentOnHabitId) return null;
    return otherHabits.find(h => h.id === dependentOnHabitId);
  }, [dependentOnHabitId, otherHabits]);

  // Pre-fill form if template is provided
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
      setXpPerUnit(templateToPreFill.xpPerUnit);
      setEnergyCostPerUnit(templateToPreFill.energyCostPerUnit);
      setSelectedIconName(templateToPreFill.icon_name);
      setPlateauDaysRequired(templateToPreFill.plateauDaysRequired);
      setShortDescription(templateToPreFill.shortDescription || '');
      // Carryover is not part of template, so default to false or infer if needed
      setCarryoverEnabled(false); 
    } else {
      // Reset form when modal closes or opens without template
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

  // Auto-generate habit key from name (only if not pre-filled)
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
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      onClose();
    },
    onError: (error) => {
      showError(`Failed to create habit: ${error.message}`);
    },
  });

  const createTemplateMutation = useCreateTemplate(); // Use the existing hook

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!habitName.trim() || !habitKey.trim() || dailyGoal <= 0 || frequency <= 0 || xpPerUnit <= 0 || energyCostPerUnit < 0) {
      showError('Please fill in all required fields with valid values.');
      return;
    }
    if (isTemplateMode && !shortDescription.trim()) {
      showError('Please provide a short description for your template.');
      return;
    }

    const habitData: CreateHabitParams = {
      name: habitName,
      habit_key: habitKey.toLowerCase().replace(/\s/g, '_'),
      category: category,
      current_daily_goal: dailyGoal,
      frequency_per_week: frequency,
      is_trial_mode: isTrialMode,
      is_fixed: isFixed,
      anchor_practice: isAnchorPractice,
      auto_chunking: autoChunking,
      unit: unit,
      xp_per_unit: xpPerUnit,
      energy_cost_per_unit: energyCostPerUnit,
      icon_name: selectedIconName,
      dependent_on_habit_id: dependentOnHabitId,
      plateau_days_required: plateauDaysRequired,
      window_start: windowStart,
      window_end: windowEnd,
      carryover_enabled: carryoverEnabled,
      short_description: shortDescription, // Include for templates
    };

    if (isTemplateMode) {
      // Map CreateHabitParams to CreateTemplateParams structure for template creation
      const templateData: CreateTemplateParams = { // Explicitly type templateData
        id: habitData.habit_key,
        name: habitData.name,
        category: habitData.category,
        default_frequency: habitData.frequency_per_week,
        default_duration: habitData.current_daily_goal,
        default_mode: habitData.is_fixed ? 'Fixed' : (habitData.is_trial_mode ? 'Trial' : 'Growth'),
        default_chunks: 1, // Templates default to 1 chunk, auto-chunking handles more
        auto_chunking: habitData.auto_chunking,
        anchor_practice: habitData.anchor_practice,
        unit: habitData.unit,
        xp_per_unit: habitData.xp_per_unit,
        energy_cost_per_unit: habitData.energy_cost_per_unit,
        icon_name: habitData.icon_name,
        plateau_days_required: habitData.plateau_days_required,
        short_description: habitData.short_description || '',
        is_public: true, // Templates are public by default
      };
      createTemplateMutation.mutate(templateData);
    } else {
      createHabitMutation.mutate(habitData);
    }
  };

  const IconComponent = getHabitIconComponent(selectedIconName);

  const isPending = createHabitMutation.isPending || createTemplateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="sticky top-0 bg-background/95 backdrop-blur-sm p-6 border-b z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {isTemplateMode ? <LayoutTemplate className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{isTemplateMode ? 'Contribute New Template' : 'Create New Habit'}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {isTemplateMode ? 'Share your successful habit with the community' : 'Define your habit with full control over all parameters'}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Habit Details Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {isTemplateMode ? 'Template Info' : 'Habit Details'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="habitName">{isTemplateMode ? 'Template Name' : 'Habit Name'} *</Label>
                <Input
                  id="habitName"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g., Daily Reading"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="habitKey">{isTemplateMode ? 'Unique Template ID' : 'Unique Key'} *</Label>
                <Input
                  id="habitKey"
                  value={habitKey}
                  onChange={(e) => setHabitKey(e.target.value)}
                  placeholder="e.g., daily_reading"
                  className="h-12 rounded-xl"
                  required
                />
                <p className="text-xs text-muted-foreground">Auto-generated from name, but editable</p>
              </div>
            </div>

            {isTemplateMode && (
              <div className="space-y-3">
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A brief description for the template list."
                  className="min-h-[80px] rounded-xl"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: HabitCategoryType) => setCategory(value)}>
                  <SelectTrigger id="category" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {habitCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={(value: 'min' | 'reps' | 'dose') => {
                  setUnit(value);
                  // If changing to 'dose' and current dailyGoal is not 1, suggest 1
                  if (value === 'dose' && dailyGoal !== 1) {
                    setDailyGoal(1);
                  }
                }}>
                  <SelectTrigger id="unit" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select unit" />
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

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={selectedIconName} onValueChange={setSelectedIconName}>
                  <SelectTrigger id="icon" className="h-12 rounded-xl">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {habitIcons.find(i => i.value === selectedIconName)?.label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {habitIcons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <icon.icon className="w-4 h-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Goals & Schedule Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Goals & Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Goal ({unit}) *</Label>
                <Input
                  id="dailyGoal"
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="h-12 rounded-xl"
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Weekly Frequency *</Label>
                <Slider
                  id="frequency"
                  min={1}
                  max={7}
                  step={1}
                  value={[frequency]}
                  onValueChange={(val) => setFrequency(val[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1x</span>
                  <span className="font-bold text-foreground">{frequency} times per week</span>
                  <span>7x</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-sm font-semibold text-primary mb-2">Estimated Weekly Total</p>
              <p className="text-2xl font-bold">{estimatedWeeklyTotal} {unit}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {dailyGoal} {unit} × {frequency} sessions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black uppercase opacity-60">Window Start</Label>
                </div>
                <Select value={windowStart || ''} onValueChange={setWindowStart}>
                  <SelectTrigger id="windowStart" className="h-12 rounded-xl">
                    <SelectValue placeholder="Anytime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Anytime</SelectItem>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                </div>
                <Select value={windowEnd || ''} onValueChange={setWindowEnd}>
                  <SelectTrigger id="windowEnd" className="h-12 rounded-xl">
                    <SelectValue placeholder="Anytime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Anytime</SelectItem>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Growth Logic Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Growth Logic
            </h3>

            <div className="space-y-3">
              <Label>Habit Mode</Label>
              <div className="flex flex-col gap-2">
                {habitModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setIsTrialMode(mode.value === 'Trial');
                      setIsFixed(mode.value === 'Fixed');
                    }}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border-2 text-left w-full transition-all",
                      (isTrialMode && mode.value === 'Trial') || (isFixed && mode.value === 'Fixed') || (!isTrialMode && !isFixed && mode.value === 'Growth')
                        ? "border-primary bg-primary/[0.02] shadow-sm"
                        : "border-transparent bg-muted/30 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", (isTrialMode && mode.value === 'Trial') || (isFixed && mode.value === 'Fixed') || (!isTrialMode && !isFixed && mode.value === 'Growth') ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground")}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex gap-3">
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <Anchor className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Anchor Practice</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Prioritize this habit on your dashboard.</p>
                  </div>
                </div>
                <Switch 
                  checked={isAnchorPractice} 
                  onCheckedChange={setIsAnchorPractice} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-info-background/50 border border-info-border/50">
                <div className="flex gap-3">
                  <div className="bg-info-background/50 p-2 rounded-xl">
                    <Layers className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Adaptive Auto-Chunking</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Automagically break sessions into capsules.</p>
                  </div>
                </div>
                <Switch 
                  checked={autoChunking} 
                  onCheckedChange={setAutoChunking} 
                />
              </div>
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
                  value={plateauDaysRequired}
                  onChange={(e) => setPlateauDaysRequired(parseInt(e.target.value))}
                />
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Days of 100% consistency required before the system suggests a goal increase.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Dependent On</Label>
              <Select
                value={dependentOnHabitId || 'none'}
                onValueChange={(value) => setDependentOnHabitId(value === 'none' ? null : value)}
              >
                <SelectTrigger className="h-11 rounded-xl font-bold text-base">
                  <SelectValue placeholder="No dependency">
                    {selectedDependentHabit?.name || "No dependency"}
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

            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="flex gap-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase">Carryover Enabled</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Unused progress rolls over to next day.</p>
                </div>
              </div>
              <Switch 
                checked={carryoverEnabled} 
                onCheckedChange={setCarryoverEnabled} 
              />
            </div>
          </div>

          {/* Advanced Settings Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Advanced Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="xpPerUnit">XP per {unit}</Label>
                <Input
                  id="xpPerUnit"
                  type="number"
                  value={xpPerUnit}
                  onChange={(e) => setXpPerUnit(Number(e.target.value))}
                  className="h-12 rounded-xl"
                  min={0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="energyCostPerUnit">Energy Cost per {unit}</Label>
                <Input
                  id="energyCostPerUnit"
                  type="number"
                  value={energyCostPerUnit}
                  onChange={(e) => setEnergyCostPerUnit(Number(e.target.value))}
                  className="h-12 rounded-xl"
                  min={0}
                  step={0.1}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-semibold"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isTemplateMode ? <LayoutTemplate className="w-6 h-6 mr-2" /> : <Plus className="w-6 h-6 mr-2" />}
                  {isTemplateMode ? 'Contribute Template' : 'Create Habit'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};