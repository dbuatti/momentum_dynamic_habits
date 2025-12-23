"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Target, Anchor, Zap, ShieldCheck, Brain, Clock, Layers,
  Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  Plus, Loader2, Check, Info, Eye, EyeOff, ArrowRight, FlaskConical,
  Calendar, Timer, Settings, LayoutTemplate, X, TrendingUp, Smile, Lightbulb
} from 'lucide-react';
import { habitTemplates, habitCategories, habitUnits, habitModes, habitIcons, HabitTemplate, motivationTypes } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserHabitRecord, HabitCategory as HabitCategoryType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { habitIconMap } from '@/lib/habit-utils';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';
import { useUserHabitWizardTemp, WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface CreateHabitParams {
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
}

const createNewHabit = async ({ userId, habit, neurodivergentMode }: { userId: string; habit: CreateHabitParams; neurodivergentMode: boolean }) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  const { name, habit_key, category, current_daily_goal, frequency_per_week, is_trial_mode, is_fixed, anchor_practice, auto_chunking, unit, xp_per_unit, energy_cost_per_unit, icon_name, dependent_on_habit_id, window_start, window_end } = habit;

  // Determine plateau days based on mode and neurodivergent setting
  let calculatedPlateauDays = habit.plateau_days_required;
  if (is_trial_mode) {
    calculatedPlateauDays = neurodivergentMode ? 14 : 7; // Longer trial for ND
  } else if (is_fixed) {
    calculatedPlateauDays = 7; // Fixed habits still have a plateau for consistency tracking
  } else {
    calculatedPlateauDays = neurodivergentMode ? 10 : 5; // Longer growth plateau for ND
  }

  // Calculate chunking parameters
  let numChunks = 1;
  let chunkDuration = current_daily_goal;
  if (auto_chunking && unit === 'min' && current_daily_goal > (neurodivergentMode ? 5 : 10)) {
    const targetChunkSize = neurodivergentMode ? 5 : 10; // 5 min for ND, 10 for standard
    numChunks = Math.max(1, Math.ceil(current_daily_goal / targetChunkSize));
    chunkDuration = Number((current_daily_goal / numChunks).toFixed(1));
  } else if (auto_chunking && unit === 'reps' && current_daily_goal > (neurodivergentMode ? 10 : 20)) {
    const targetChunkSize = neurodivergentMode ? 10 : 20; // 10 reps for ND, 20 for standard
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
    long_term_goal: current_daily_goal * (unit === 'min' ? 365 * 60 : 365), // Example: 1 year goal in seconds or reps
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
    days_of_week: [0, 1, 2, 3, 4, 5, 6], // Default to all days
    auto_chunking: auto_chunking,
    enable_chunks: auto_chunking, // enable_chunks follows auto_chunking for new habits
    num_chunks: numChunks,
    chunk_duration: chunkDuration,
    is_visible: true,
    dependent_on_habit_id: dependent_on_habit_id,
    anchor_practice: anchor_practice,
    carryover_value: 0, // Initialize carryover_value
  };

  const { error } = await supabase.from('user_habits').upsert(habitToInsert, { onConflict: 'user_id, habit_key' });

  if (error) throw error;
  return { success: true };
};

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

const getHabitIconComponent = (iconName: string) => {
  return habitIcons.find(i => i.value === iconName)?.icon || habitIconMap.custom_habit;
};

const HabitWizard = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const { wizardProgress, isLoading: isLoadingWizardProgress, saveProgress, deleteProgress } = useUserHabitWizardTemp();

  // Determine if we are in template creation mode (bypasses guided flow)
  const isTemplateCreationMode = location.state?.mode === 'template';
  const templateToPreFill: HabitTemplate | undefined = location.state?.templateToPreFill;

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<WizardHabitData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing wizard progress on mount
  useEffect(() => {
    if (!isLoadingWizardProgress && wizardProgress && !isTemplateCreationMode && !templateToPreFill) {
      setCurrentStep(wizardProgress.current_step);
      setWizardData(wizardProgress.habit_data);
    } else if (isTemplateCreationMode || templateToPreFill) {
      // If in template mode, bypass wizard steps and go straight to form
      setCurrentStep(99); // A high number to indicate template form
      if (templateToPreFill) {
        // Pre-fill form fields from template
        setWizardData({
          name: templateToPreFill.name,
          habit_key: templateToPreFill.id,
          category: templateToPreFill.category,
          daily_goal: templateToPreFill.defaultDuration,
          frequency_per_week: templateToPreFill.defaultFrequency,
          is_trial_mode: templateToPreFill.defaultMode === 'Trial',
          is_fixed: templateToPreFill.defaultMode === 'Fixed',
          anchor_practice: templateToPreFill.anchorPractice,
          auto_chunking: templateToPreFill.autoChunking,
          unit: templateToPreFill.unit,
          xp_per_unit: templateToPreFill.xpPerUnit,
          energy_cost_per_unit: templateToPreFill.energyCostPerUnit,
          icon_name: templateToPreFill.icon_name,
          plateau_days_required: templateToPreFill.plateauDaysRequired,
          short_description: templateToPreFill.shortDescription,
        });
      }
    }
  }, [isLoadingWizardProgress, wizardProgress, isTemplateCreationMode, templateToPreFill]);

  // Auto-generate habit key from name
  useEffect(() => {
    if (wizardData.name && !wizardData.habit_key) {
      const key = wizardData.name.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
      setWizardData(prev => ({ ...prev, habit_key: key }));
    }
  }, [wizardData.name, wizardData.habit_key]);

  const handleSaveAndNext = useCallback(async (nextStep: number, dataToSave: Partial<WizardHabitData>) => {
    setIsSaving(true);
    try {
      const updatedWizardData = { ...wizardData, ...dataToSave };
      await saveProgress({ current_step: nextStep, habit_data: updatedWizardData });
      setWizardData(updatedWizardData);
      setCurrentStep(nextStep);
    } catch (error) {
      console.error("Failed to save wizard progress:", error);
      showError("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [saveProgress, wizardData]);

  const handleBack = useCallback(async () => {
    const prevStep = currentStep - 1;
    if (prevStep >= 1) {
      // No need to save on back, just update step and UI will reflect saved data
      setCurrentStep(prevStep);
    } else {
      // If going back from step 1, navigate to dashboard and clear wizard progress
      await deleteProgress();
      navigate('/');
    }
  }, [currentStep, deleteProgress, navigate]);

  const createHabitMutation = useMutation({
    mutationFn: (habit: CreateHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createNewHabit({ userId: session.user.id, habit, neurodivergentMode });
    },
    onSuccess: async () => {
      showSuccess('Habit created successfully!');
      await deleteProgress(); // Clear wizard progress after successful habit creation
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      navigate('/');
    },
    onError: (error) => {
      showError(`Failed to create habit: ${error.message}`);
    },
  });

  const createTemplateMutation = useCreateTemplate();

  const handleSubmitFinal = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Basic validation for final submission
    if (!wizardData.name?.trim() || !wizardData.habit_key?.trim() || (wizardData.daily_goal || 0) <= 0 || (wizardData.frequency_per_week || 0) <= 0 || (wizardData.xp_per_unit || 0) <= 0 || (wizardData.energy_cost_per_unit || 0) < 0) {
      showError('Please ensure all required habit details are filled with valid values.');
      return;
    }

    if (isTemplateCreationMode && !wizardData.short_description?.trim()) {
      showError('Please provide a short description for your template.');
      return;
    }

    const habitData: CreateHabitParams = {
      name: wizardData.name,
      habit_key: wizardData.habit_key.toLowerCase().replace(/\s/g, '_'),
      category: wizardData.category as HabitCategoryType,
      current_daily_goal: wizardData.daily_goal || 1,
      frequency_per_week: wizardData.frequency_per_week || 1,
      is_trial_mode: wizardData.is_trial_mode || false,
      is_fixed: wizardData.is_fixed || false,
      anchor_practice: wizardData.anchor_practice || false,
      auto_chunking: wizardData.auto_chunking || false,
      unit: wizardData.unit || 'min',
      xp_per_unit: wizardData.xp_per_unit || 0,
      energy_cost_per_unit: wizardData.energy_cost_per_unit || 0,
      icon_name: wizardData.icon_name || 'Target',
      dependent_on_habit_id: wizardData.dependent_on_habit_id || null,
      plateau_days_required: wizardData.plateau_days_required || 7,
      window_start: wizardData.window_start || null,
      window_end: wizardData.window_end || null,
    };

    if (isTemplateCreationMode) {
      createTemplateMutation.mutate({
        id: habitData.habit_key,
        name: habitData.name,
        category: habitData.category.toString(),
        default_frequency: habitData.frequency_per_week,
        default_duration: habitData.current_daily_goal,
        default_mode: habitData.is_fixed ? 'Fixed' : (habitData.is_trial_mode ? 'Trial' : 'Growth'),
        default_chunks: 1, // Default to 1 for templates, auto-chunking will handle it for user habits
        auto_chunking: habitData.auto_chunking,
        anchor_practice: habitData.anchor_practice,
        unit: habitData.unit,
        xp_per_unit: habitData.xp_per_unit,
        energy_cost_per_unit: habitData.energy_cost_per_unit,
        icon_name: habitData.icon_name,
        plateau_days_required: habitData.plateau_days_required,
        short_description: wizardData.short_description || '',
        is_public: true,
      });
    } else {
      createHabitMutation.mutate(habitData);
    }
  };

  const totalGuidedSteps = 6; // Updated total steps
  const progress = (currentStep / totalGuidedSteps) * 100;

  if (isLoadingWizardProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const renderWizardStep = () => {
    switch (currentStep) {
      case 1: // Habit Focus
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">What kind of habit do you want to build?</h2>
              <p className="text-muted-foreground">Choose an area to focus on. You can always customize later.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {habitCategories.filter(cat => cat.value !== 'anchor').map((cat) => { // Exclude 'anchor' from initial selection
                const Icon = cat.icon;
                const isSelected = wizardData.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={cn(
                      "border rounded-xl p-3 cursor-pointer transition-all text-left",
                      isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted/50'
                    )}
                    onClick={() => {
                      // Auto-populate some defaults based on category
                      const template = habitTemplates.find(t => t.category === cat.value && t.defaultMode === 'Trial');
                      setWizardData(prev => ({
                        ...prev,
                        category: cat.value,
                        unit: template?.unit || 'min',
                        icon_name: template?.icon_name || cat.icon_name, // <-- FIX APPLIED HERE
                        name: template?.name || '',
                        habit_key: template?.id || '',
                        daily_goal: template?.defaultDuration || 15,
                        frequency_per_week: template?.defaultFrequency || 3,
                        is_trial_mode: true, // Start in trial mode by default
                        is_fixed: false,
                        anchor_practice: template?.anchorPractice || false,
                        auto_chunking: template?.autoChunking || true,
                        xp_per_unit: template?.xpPerUnit || 30,
                        energy_cost_per_unit: template?.energyCostPerUnit || 6,
                        plateau_days_required: template?.plateauDaysRequired || 7,
                        short_description: template?.shortDescription || '',
                      }));
                    }}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
                      <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 2: // Motivation
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Why is this habit important to you?</h2>
              <p className="text-muted-foreground">Understanding your motivation helps us tailor guidance.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {motivationTypes.map((motivation) => {
                const Icon = motivation.icon;
                const isSelected = wizardData.motivation_type === motivation.value;
                return (
                  <button
                    key={motivation.value}
                    type="button"
                    className={cn(
                      "border rounded-xl p-3 cursor-pointer transition-all text-left",
                      isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted/50'
                    )}
                    onClick={() => {
                      setWizardData(prev => ({ ...prev, motivation_type: motivation.value as WizardHabitData['motivation_type'] }));
                      // Logic to set anchor_practice based on motivation
                      if (motivation.value === 'routine_building' || motivation.value === 'stress_reduction') {
                        setWizardData(prev => ({ ...prev, anchor_practice: true }));
                      } else {
                        setWizardData(prev => ({ ...prev, anchor_practice: false }));
                      }
                    }}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
                      <span className="text-xs font-bold text-center leading-tight">{motivation.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      // Placeholder for other steps
      case 3: return <div className="text-center text-muted-foreground">Step 3: Current Capacity (Coming Soon!)</div>;
      case 4: return <div className="text-center text-muted-foreground">Step 4: Barriers (Coming Soon!)</div>;
      case 5: return <div className="text-center text-muted-foreground">Step 5: Timing & Dependencies (Coming Soon!)</div>;
      case 6: return <div className="text-center text-muted-foreground">Step 6: Confidence & Growth (Coming Soon!)</div>;
      case 7: return <div className="text-center text-muted-foreground">Step 7: Advanced Guidance (Coming Soon!)</div>;
      case 8: return <div className="text-center text-muted-foreground">Step 8: Preview & Adjust (Coming Soon!)</div>;
      case 99: // Template creation form
        const IconComponent = getHabitIconComponent(wizardData.icon_name || 'Target');
        return (
          <form onSubmit={handleSubmitFinal} className="space-y-8 max-w-md mx-auto">
            <Card className="rounded-3xl shadow-sm border-0">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <LayoutTemplate className="w-5 h-5 text-primary" />
                  Template Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="habitName">Template Name</Label>
                  <Input
                    id="habitName"
                    value={wizardData.name || ''}
                    onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Daily Reading, Morning Run"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="habitKey">Unique Template ID</Label>
                  <Input
                    id="habitKey"
                    value={wizardData.habit_key || ''}
                    onChange={(e) => setWizardData(prev => ({ ...prev, habit_key: e.target.value }))}
                    placeholder="e.g., morning_meditation_template"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={wizardData.short_description || ''}
                    onChange={(e) => setWizardData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="A brief description for the template list."
                    className="min-h-[80px] rounded-xl"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="category">Category</Label>
                    <Select value={wizardData.category || ''} onValueChange={(value: HabitCategoryType) => setWizardData(prev => ({ ...prev, category: value }))}>
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
                  <div className="space-y-3">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={wizardData.unit || ''} onValueChange={(value: 'min' | 'reps' | 'dose') => setWizardData(prev => ({ ...prev, unit: value }))}>
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
                </div>
                <div className="space-y-3">
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={wizardData.icon_name || ''} onValueChange={(value) => setWizardData(prev => ({ ...prev, icon_name: value }))}>
                    <SelectTrigger id="icon" className="h-12 rounded-xl">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {habitIcons.find(i => i.value === (wizardData.icon_name || 'Target'))?.label}
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
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm border-0">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <Clock className="w-5 h-5 text-primary" />
                  Goals & Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="dailyGoal">Daily Goal ({wizardData.unit || 'min'})</Label>
                  <Input
                    id="dailyGoal"
                    type="number"
                    value={wizardData.daily_goal || 15}
                    onChange={(e) => setWizardData(prev => ({ ...prev, daily_goal: Number(e.target.value) }))}
                    className="h-12 rounded-xl"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="frequency">Weekly Frequency</Label>
                  <Slider
                    id="frequency"
                    min={1}
                    max={7}
                    step={1}
                    value={[wizardData.frequency_per_week || 3]}
                    onValueChange={(val) => setWizardData(prev => ({ ...prev, frequency_per_week: val[0] }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1x</span>
                    <span>{wizardData.frequency_per_week || 3} times per week</span>
                    <span>7x</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 ml-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase opacity-60">Window Start</Label>
                    </div>
                    <Select value={wizardData.window_start || ''} onValueChange={(value) => setWizardData(prev => ({ ...prev, window_start: value || null }))}>
                      <SelectTrigger id="windowStart" className="h-12 rounded-xl"><SelectValue placeholder="Anytime" /></SelectTrigger>
                      <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 ml-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                    </div>
                    <Select value={wizardData.window_end || ''} onValueChange={(value) => setWizardData(prev => ({ ...prev, window_end: value || null }))}>
                      <SelectTrigger id="windowEnd" className="h-12 rounded-xl"><SelectValue placeholder="Anytime" /></SelectTrigger>
                      <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm border-0">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <Brain className="w-5 h-5 text-primary" />
                  Growth Logic
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="space-y-3">
                  <Label>Habit Mode</Label>
                  <div className="flex flex-col gap-2">
                    {habitModes.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => {
                          setWizardData(prev => ({
                            ...prev,
                            is_trial_mode: mode.value === 'Trial',
                            is_fixed: mode.value === 'Fixed',
                          }));
                        }}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-2xl border-2 text-left w-full transition-all",
                          ((wizardData.is_trial_mode && mode.value === 'Trial') || (wizardData.is_fixed && mode.value === 'Fixed') || (!wizardData.is_trial_mode && !wizardData.is_fixed && mode.value === 'Growth'))
                            ? "border-primary bg-primary/[0.02] shadow-sm"
                            : "border-transparent bg-muted/30 opacity-60 hover:opacity-100"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", ((wizardData.is_trial_mode && mode.value === 'Trial') || (wizardData.is_fixed && mode.value === 'Fixed') || (!wizardData.is_trial_mode && !wizardData.is_fixed && mode.value === 'Growth')) ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground")}>
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
                    checked={wizardData.anchor_practice || false}
                    onCheckedChange={(v) => setWizardData(prev => ({ ...prev, anchor_practice: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex gap-4">
                    <div className="bg-blue-500/20 p-2 rounded-xl">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase">Adaptive Auto-Chunking</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Automagically break sessions into capsules.</p>
                    </div>
                  </div>
                  <Switch
                    checked={wizardData.auto_chunking || false}
                    onCheckedChange={(v) => setWizardData(prev => ({ ...prev, auto_chunking: v, enable_chunks: v }))}
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
                      value={wizardData.plateau_days_required || 7}
                      onChange={(e) => setWizardData(prev => ({ ...prev, plateau_days_required: parseInt(e.target.value) }))}
                    />
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Days of 100% consistency required before the system suggests a goal increase.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Dependent On</Label>
                  <Select
                    value={wizardData.dependent_on_habit_id || 'none'}
                    onValueChange={(value) => setWizardData(prev => ({ ...prev, dependent_on_habit_id: value === 'none' ? null : value }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl font-bold text-base">
                      <SelectValue placeholder="No dependency">
                        {journeyData?.allHabits.find(h => h.id === wizardData.dependent_on_habit_id)?.name || "No dependency"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No dependency</SelectItem>
                      {journeyData?.allHabits.filter(h => h.id !== wizardData.habit_key).map(otherHabit => (
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
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm border-0">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <Info className="w-5 h-5 text-primary" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="xpPerUnit">XP per {wizardData.unit || 'unit'}</Label>
                    <Input
                      id="xpPerUnit"
                      type="number"
                      value={wizardData.xp_per_unit || 30}
                      onChange={(e) => setWizardData(prev => ({ ...prev, xp_per_unit: Number(e.target.value) }))}
                      className="h-12 rounded-xl"
                      min={0}
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="energyCostPerUnit">Energy Cost per {wizardData.unit || 'unit'}</Label>
                    <Input
                      id="energyCostPerUnit"
                      type="number"
                      value={wizardData.energy_cost_per_unit || 6}
                      onChange={(e) => setWizardData(prev => ({ ...prev, energy_cost_per_unit: Number(e.target.value) }))}
                      className="h-12 rounded-xl"
                      min={0}
                      step={0.1}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-lg font-bold"
              disabled={createHabitMutation.isPending || createTemplateMutation.isPending || isSaving}
            >
              {createHabitMutation.isPending || createTemplateMutation.isPending || isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Plus className="w-6 h-6 mr-2" />
                  Contribute Template
                </>
              )}
            </Button>
          </form>
        );
      default:
        return <div className="text-center text-muted-foreground">Unknown Step</div>;
    }
  };

  const isNextDisabled = useMemo(() => {
    if (currentStep === 1 && !wizardData.category) return true;
    if (currentStep === 2 && !wizardData.motivation_type) return true;
    // Add more validation for future steps
    return false;
  }, [currentStep, wizardData]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title={isTemplateCreationMode ? "Contribute New Template" : "Habit Wizard"} />

      <Card className="w-full max-w-md mx-auto shadow-xl rounded-3xl overflow-hidden border-0">
        <CardHeader className="pb-0">
          {!isTemplateCreationMode && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {currentStep} of {totalGuidedSteps}</div>
              <div className="text-xs font-bold text-primary">{Math.round(progress)}%</div>
            </div>
          )}
          {!isTemplateCreationMode && (
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </CardHeader>
        <CardContent className="py-8">
          {renderWizardStep()}

          {!isTemplateCreationMode && (
            <div className="flex justify-between mt-8 gap-4">
              <Button variant="ghost" onClick={handleBack} disabled={isSaving || currentStep === 1} className="rounded-2xl px-8">Back</Button>
              <Button onClick={() => handleSaveAndNext(currentStep + 1, wizardData)} disabled={isSaving || isNextDisabled} className="flex-1 rounded-2xl h-12 text-base font-bold">
                {currentStep === totalGuidedSteps ? 'Create Habit' : 'Next'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitWizard;