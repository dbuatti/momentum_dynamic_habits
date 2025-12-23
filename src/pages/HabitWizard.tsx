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

// Import Macro Steps
import { HabitWizardStep1 } from '@/components/habits/wizard/HabitWizardStep1';
import { HabitWizardStep2 } from '@/components/habits/wizard/HabitWizardStep2';

// Import Micro Steps
import { Step3_EnergyPerSession } from '@/components/habits/wizard/micro/Step3_EnergyPerSession';
import { Step3_ConsistencyReality } from '@/components/habits/wizard/micro/Step3_ConsistencyReality';
import { Step3_EmotionalCost } from '@/components/habits/wizard/micro/Step3_EmotionalCost';
import { Step3_ConfidenceCheck } from '@/components/habits/wizard/micro/Step3_ConfidenceCheck';
import { Step4_Barriers } from '@/components/habits/wizard/micro/Step4_Barriers';
import { Step4_MissedDayResponse } from '@/components/habits/wizard/micro/Step4_MissedDayResponse';
import { Step4_SensitivitySetting } from '@/components/habits/wizard/micro/Step4_SensitivitySetting';
import { Step5_TimeOfDayFit } from '@/components/habits/wizard/micro/Step5_TimeOfDayFit';
import { Step5_DependencyCheck } from '@/components/habits/wizard/micro/Step5_DependencyCheck';
import { Step5_TimePressureCheck } from '@/components/habits/wizard/micro/Step5_TimePressureCheck';
import { Step6_GrowthAppetite } from '@/components/habits/wizard/micro/Step6_GrowthAppetite';
import { Step6_GrowthStyle } from '@/components/habits/wizard/micro/Step6_GrowthStyle';
import { Step6_FailureResponse } from '@/components/habits/wizard/micro/Step6_FailureResponse';
import { Step6_SuccessDefinition } from '@/components/habits/wizard/micro/Step6_SuccessDefinition';
import { HabitTemplateForm } from '@/components/habits/wizard/HabitTemplateForm';

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
  carryover_enabled: boolean; // Added
}

const createNewHabit = async ({ userId, habit, neurodivergentMode }: { userId: string; habit: CreateHabitParams; neurodivergentMode: boolean }) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  const { name, habit_key, category, current_daily_goal, frequency_per_week, is_trial_mode, is_fixed, anchor_practice, auto_chunking, unit, xp_per_unit, energy_cost_per_unit, icon_name, dependent_on_habit_id, window_start, window_end, carryover_enabled } = habit;

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
    carryover_value: carryover_enabled ? 1 : 0, // Initialize carryover_value based on flag
  };

  const { error } = await supabase.from('user_habits').upsert(habitToInsert, { onConflict: 'user_id, habit_key' });

  if (error) throw error;
  return { success: true };
};

// Define the micro-step sequence
const MICRO_STEPS = [
  // Step 3: Current Capacity
  '3.1', '3.2', '3.3', '3.4',
  // Step 4: Barriers
  '4.1', '4.2', '4.3',
  // Step 5: Timing & Dependencies
  '5.1', '5.2', '5.3',
  // Step 6: Confidence & Growth
  '6.1', '6.2', '6.3', '6.4',
];

// --- LOGIC MAPPING ---
// This function calculates final habit parameters from micro-step answers
const calculateHabitParams = (data: Partial<WizardHabitData>): Partial<CreateHabitParams> => {
  // 1. Calculate Daily Goal & Frequency
  let dailyGoal = 15; // Default
  let frequency = 3; // Default

  if (data.energy_per_session === 'very_little') dailyGoal = 5;
  if (data.energy_per_session === 'a_bit') dailyGoal = 10;
  if (data.energy_per_session === 'moderate') dailyGoal = 20;
  if (data.energy_per_session === 'plenty') dailyGoal = 30;

  if (data.consistency_reality === '1-2_days') frequency = 2;
  if (data.consistency_reality === '3-4_days') frequency = 3;
  if (data.consistency_reality === 'most_days') frequency = 5;
  if (data.consistency_reality === 'daily') frequency = 7;

  // 2. Determine Mode (Trial vs Growth vs Fixed)
  let isTrial = false;
  let isFixed = false;
  let plateauDays = 7;

  // Confidence Check influences plateau
  const confidence = data.confidence_check || 5;
  if (confidence < 4) plateauDays = 14;
  else if (confidence > 7) plateauDays = 5;

  // Emotional Cost influences trial mode
  if (data.emotional_cost === 'heavy') isTrial = true;

  // Growth Appetite influences fixed/trial
  if (data.growth_appetite === 'steady') isFixed = true;
  if (data.growth_appetite === 'suggest' || data.growth_appetite === 'auto') isTrial = false; // Start in growth

  // 3. Auto-Chunking & Anchor Practice
  const autoChunking = data.energy_per_session === 'plenty' || data.energy_per_session === 'moderate';
  const anchorPractice = data.motivation_type === 'routine_building' || data.motivation_type === 'stress_reduction';

  // 4. XP & Energy Cost (Base values, can be tweaked)
  let xpPerUnit = 30;
  let energyCostPerUnit = 6;
  if (data.unit === 'reps') { xpPerUnit = 1; energyCostPerUnit = 0.5; }
  if (data.unit === 'dose') { xpPerUnit = 10; energyCostPerUnit = 0; }

  // 5. Windows
  let windowStart = null;
  let windowEnd = null;
  if (data.time_of_day_fit === 'morning') { windowStart = '06:00'; windowEnd = '10:00'; }
  if (data.time_of_day_fit === 'afternoon') { windowStart = '10:00'; windowEnd = '14:00'; }
  if (data.time_of_day_fit === 'evening') { windowStart = '18:00'; windowEnd = '22:00'; }

  // 6. Dependencies
  let dependentOnHabitId = null;
  if (data.dependency_check === 'after_another_habit') {
    // We can't resolve the ID here, the user must select it in the macro form or we add a micro-step for selection.
    // For now, we'll leave it null and let the user edit it later.
  }

  // 7. Carryover
  const carryoverEnabled = data.time_pressure_check === 'only_if_time' || data.time_pressure_check === 'decide_later';

  return {
    current_daily_goal: dailyGoal, // Fixed: Changed from daily_goal to current_daily_goal
    frequency_per_week: frequency,
    is_trial_mode: isTrial,
    is_fixed: isFixed,
    anchor_practice: anchorPractice,
    auto_chunking: autoChunking,
    xp_per_unit: xpPerUnit,
    energy_cost_per_unit: energyCostPerUnit,
    dependent_on_habit_id: dependentOnHabitId,
    plateau_days_required: plateauDays,
    window_start: windowStart,
    window_end: windowEnd,
    carryover_enabled: carryoverEnabled,
  };
};

const HabitWizard = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const { wizardProgress, isLoading: isLoadingWizardProgress, saveProgress, deleteProgress } = useUserHabitWizardTemp();

  const isTemplateCreationMode = location.state?.mode === 'template';
  const templateToPreFill: HabitTemplate | undefined = location.state?.templateToPreFill;

  const [currentStep, setCurrentStep] = useState(1); // 1, 2, or 99 (template)
  const [currentMicroStep, setCurrentMicroStep] = useState(0); // Index in MICRO_STEPS
  const [wizardData, setWizardData] = useState<Partial<WizardHabitData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing wizard progress on mount
  useEffect(() => {
    if (!isLoadingWizardProgress && wizardProgress && !isTemplateCreationMode && !templateToPreFill) {
      setCurrentStep(wizardProgress.current_step);
      setWizardData(wizardProgress.habit_data);
      // If step is > 2, we are in micro-steps. We need to find the index.
      // For simplicity, we'll reset micro-step to 0 if loading a saved state that is in micro-steps.
      // A more robust solution would save the micro-step index too.
      if (wizardProgress.current_step > 2) {
        // This is a simplification. In a real app, you'd save the exact micro-step index.
        // We'll just start from the beginning of the micro-steps if they are in that range.
        setCurrentMicroStep(0);
      }
    } else if (isTemplateCreationMode || templateToPreFill) {
      setCurrentStep(99);
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
    if (!templateToPreFill && wizardData.name) {
      const key = wizardData.name.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
      setWizardData(prev => ({ ...prev, habit_key: key }));
    }
  }, [wizardData.name, wizardData.habit_key, templateToPreFill]);

  // Define createHabitMutation here to avoid circular dependency in handleSaveAndNext
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

  const handleSaveAndNext = useCallback(async (dataToSave: Partial<WizardHabitData>) => {
    setIsSaving(true);
    try {
      const updatedWizardData = { ...wizardData, ...dataToSave };
      
      // Determine next step
      let nextStep = currentStep;
      let nextMicroIndex = currentMicroStep;
      let shouldSaveProgress = true;

      if (currentStep === 1) {
        nextStep = 2;
      } else if (currentStep === 2) {
        nextStep = 3; // Start micro-steps
        nextMicroIndex = 0;
      } else if (currentStep === 3) {
        // In micro-steps
        if (currentMicroStep < MICRO_STEPS.length - 1) {
          nextMicroIndex = currentMicroStep + 1;
        } else {
          // End of micro-steps, go to template form or finish
          if (isTemplateCreationMode) {
            // Should not happen as template mode skips micro-steps, but for safety
            shouldSaveProgress = false;
            handleSubmitFinal();
            return;
          } else {
            // Calculate final parameters and submit
            const calculatedParams = calculateHabitParams(updatedWizardData);
            const finalHabitData: CreateHabitParams = {
              name: updatedWizardData.name!,
              habit_key: updatedWizardData.habit_key!,
              category: updatedWizardData.category as HabitCategoryType,
              unit: updatedWizardData.unit || 'min',
              icon_name: updatedWizardData.icon_name || 'Target',
              ...calculatedParams,
            } as CreateHabitParams;

            await createHabitMutation.mutateAsync(finalHabitData);
            shouldSaveProgress = false; // Don't save progress if we are finishing
            return;
          }
        }
      }

      if (shouldSaveProgress) {
        await saveProgress({ current_step: nextStep, habit_data: updatedWizardData });
        setWizardData(updatedWizardData);
        setCurrentStep(nextStep);
        setCurrentMicroStep(nextMicroIndex);
      }
    } catch (error) {
      console.error("Failed to save wizard progress:", error);
      showError("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [saveProgress, wizardData, currentStep, currentMicroStep, isTemplateCreationMode, createHabitMutation]);

  const handleBack = useCallback(async () => {
    if (currentStep === 1) {
      await deleteProgress();
      navigate('/');
      return;
    }

    let prevStep = currentStep;
    let prevMicroIndex = currentMicroStep;

    if (currentStep === 2) {
      prevStep = 1;
    } else if (currentStep === 3) {
      if (currentMicroStep > 0) { // Fixed: changed currentMicroIndex to currentMicroStep
        prevMicroIndex = currentMicroStep - 1; // Fixed: changed currentMicroIndex to currentMicroStep
      } else {
        prevStep = 2;
        prevMicroIndex = 0;
      }
    }

    setCurrentStep(prevStep);
    setCurrentMicroStep(prevMicroIndex);
    // No need to save on back, just update UI
  }, [currentStep, currentMicroStep, deleteProgress, navigate]);

  const handleResetProgress = useCallback(async () => {
    try {
      await deleteProgress();
      setWizardData({});
      setCurrentStep(1);
      setCurrentMicroStep(0);
      showSuccess('Wizard progress reset.');
    } catch (error) {
      showError('Failed to reset progress.');
    }
  }, [deleteProgress]);

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
      carryover_enabled: wizardData.carryover_enabled || false,
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

  // Calculate progress for micro-steps
  const totalSteps = 2 + MICRO_STEPS.length; // 2 macro + N micro
  const currentGlobalIndex = currentStep === 1 ? 1 : currentStep === 2 ? 2 : 3 + currentMicroStep;
  const progress = (currentGlobalIndex / totalSteps) * 100;

  // Validation for micro-steps
  const isNextDisabled = useMemo(() => {
    if (currentStep === 1 && !wizardData.category) return true;
    if (currentStep === 2 && !wizardData.motivation_type) return true;
    
    // Micro-step validations
    if (currentStep === 3) {
      const stepId = MICRO_STEPS[currentMicroStep];
      if (stepId === '3.1' && !wizardData.energy_per_session) return true;
      if (stepId === '3.2' && !wizardData.consistency_reality) return true;
      if (stepId === '3.3' && !wizardData.emotional_cost) return true;
      if (stepId === '3.4' && !wizardData.confidence_check) return true;
      // Step 4 is optional
      // Step 5 is optional
      // Step 6 is optional
    }
    return false;
  }, [currentStep, currentMicroStep, wizardData]);

  if (isLoadingWizardProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const renderWizardStepContent = () => {
    if (currentStep === 1) return <HabitWizardStep1 wizardData={wizardData} setWizardData={setWizardData} onResetProgress={handleResetProgress} hasSavedProgress={!!wizardProgress} />;
    if (currentStep === 2) return <HabitWizardStep2 wizardData={wizardData} setWizardData={setWizardData} />;
    
    if (currentStep === 3) {
      const stepId = MICRO_STEPS[currentMicroStep];
      switch (stepId) {
        // Step 3
        case '3.1': return <Step3_EnergyPerSession wizardData={wizardData} setWizardData={setWizardData} />;
        case '3.2': return <Step3_ConsistencyReality wizardData={wizardData} setWizardData={setWizardData} />;
        case '3.3': return <Step3_EmotionalCost wizardData={wizardData} setWizardData={setWizardData} />;
        case '3.4': return <Step3_ConfidenceCheck wizardData={wizardData} setWizardData={setWizardData} />;
        // Step 4
        case '4.1': return <Step4_Barriers wizardData={wizardData} setWizardData={setWizardData} />;
        case '4.2': return <Step4_MissedDayResponse wizardData={wizardData} setWizardData={setWizardData} />;
        case '4.3': return <Step4_SensitivitySetting wizardData={wizardData} setWizardData={setWizardData} />;
        // Step 5
        case '5.1': return <Step5_TimeOfDayFit wizardData={wizardData} setWizardData={setWizardData} />;
        case '5.2': return <Step5_DependencyCheck wizardData={wizardData} setWizardData={setWizardData} />;
        case '5.3': return <Step5_TimePressureCheck wizardData={wizardData} setWizardData={setWizardData} />;
        // Step 6
        case '6.1': return <Step6_GrowthAppetite wizardData={wizardData} setWizardData={setWizardData} />;
        case '6.2': return <Step6_GrowthStyle wizardData={wizardData} setWizardData={setWizardData} />;
        case '6.3': return <Step6_FailureResponse wizardData={wizardData} setWizardData={setWizardData} />;
        case '6.4': return <Step6_SuccessDefinition wizardData={wizardData} setWizardData={setWizardData} />;
        default: return <div className="text-center text-muted-foreground">Unknown Micro Step</div>;
      }
    }

    if (currentStep === 99) {
      return (
        <HabitTemplateForm
          wizardData={wizardData}
          setWizardData={setWizardData}
          handleSubmitFinal={handleSubmitFinal}
          isSaving={isSaving}
          createHabitMutation={createHabitMutation}
          createTemplateMutation={createTemplateMutation}
        />
      );
    }
  };

  // Determine button text
  const isLastMicroStep = currentStep === 3 && currentMicroStep === MICRO_STEPS.length - 1;
  const buttonText = isLastMicroStep ? 'Create Habit' : 'Next';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title={isTemplateCreationMode ? "Contribute New Template" : "Habit Wizard"} />

      <Card className="w-full max-w-md mx-auto shadow-xl rounded-3xl overflow-hidden border-0">
        <CardHeader className="pb-0">
          {!isTemplateCreationMode && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {currentStep === 1 && "Step 1 of 2"}
                {currentStep === 2 && "Step 2 of 2"}
                {currentStep === 3 && `Micro-Step ${currentMicroStep + 1} of ${MICRO_STEPS.length}`}
              </div>
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
          {renderWizardStepContent()}

          {!isTemplateCreationMode && (
            <div className="flex justify-between mt-8 gap-4">
              <Button variant="ghost" onClick={handleBack} disabled={isSaving || (currentStep === 1 && currentMicroStep === 0)} className="rounded-2xl px-8">Back</Button>
              <Button onClick={() => handleSaveAndNext({})} disabled={isSaving || isNextDisabled} className="flex-1 rounded-2xl h-12 text-base font-bold">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : buttonText}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitWizard;