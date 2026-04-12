"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, X, Brain, Sparkles, Wand2, Compass, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";

import { habitTemplates, HabitTemplate } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { HabitCategory, MeasurementType, GrowthType, ChunkingMode } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';
import { useUserHabitWizardTemp, WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { calculateHabitParams } from '@/utils/habit-wizard-utils';

import { HabitWizardStep1 } from '@/components/habits/wizard/HabitWizardStep1';
import { HabitWizardStep2 } from '@/components/habits/wizard/HabitWizardStep2';
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
import { HabitReviewStep } from '@/pages/HabitReview';
import { WizardStepper } from '@/components/habits/wizard/WizardStepper';
import { EditHabitDetailsModal } from '@/components/habits/wizard/EditHabitDetailsModal';
import AIGenerativeDialogue from '@/components/habits/AIGenerativeDialogue';
import { timeOptions } from '@/utils/time-utils'; // Import from new utility

export interface CreateHabitParams {
  name: string;
  habit_key: string;
  category: HabitCategory;
  current_daily_goal: number;
  frequency_per_week: number;
  is_trial_mode: boolean;
  is_fixed: boolean;
  anchor_practice: boolean;
  auto_chunking: boolean;
  enable_chunks: boolean;
  chunking_mode: ChunkingMode;
  preferred_chunk_duration?: number | null;
  preferred_chunk_count?: number | null;
  unit: 'min' | 'reps' | 'dose';
  measurement_type: MeasurementType;
  xp_per_unit: number;
  energy_cost_per_unit: number;
  icon_name: string;
  dependent_on_habit_id: string | null;
  plateau_days_required: number;
  window_start: string | null;
  window_end: string | null;
  carryover_enabled: boolean;
  short_description?: string;
  growth_type: GrowthType;
  growth_value: number;
  weekly_session_min_duration: number;
  complete_on_finish: boolean;
  is_weekly_goal: boolean;
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

const MACRO_STEPS = [1, 2, 3, 4, 5, 6, 7];
const MACRO_STEP_LABELS = [
  "Category",
  "Motivation",
  "Capacity",
  "Barriers",
  "Timing",
  "Growth",
  "Review",
];
const MICRO_STEPS_MAP: { [key: number]: string[] } = {
  3: ['3.1', '3.2', '3.3', '3.4'],
  4: ['4.1', '4.2', '4.3'],
  5: ['5.1', '5.2', '5.3'],
  6: ['6.1', '6.2', '6.3', '6.4'],
  7: ['review'],
};

const HabitWizard = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const { wizardProgress, isLoading: isLoadingWizardProgress, saveProgress, clearProgress } = useUserHabitWizardTemp();

  const isTemplateCreationMode = location.state?.mode === 'template';
  const templateToPreFill: HabitTemplate | undefined = location.state?.templateToPreFill;
  const aiGeneratedData: Partial<WizardHabitData> | undefined = location.state?.aiGeneratedData;

  const [setupPath, setSetupPath] = useState<'selection' | 'guided' | 'ai'>(
    aiGeneratedData ? 'guided' : (wizardProgress ? 'guided' : 'selection')
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [currentMicroStepIndex, setCurrentMicroStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState<Partial<WizardHabitData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  
  const discardInProgress = useRef(false); 
  const [hasLoadedInitialProgress, setHasLoadedInitialProgress] = useState(false);
  
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editableHabitData, setEditableHabitData] = useState<Partial<CreateHabitParams>>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  const createHabitMutation = useMutation({
    mutationFn: (habit: CreateHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createNewHabit({ userId: session.user.id, habit, neurodivergentMode });
    },
    onSuccess: async () => {
      showSuccess('Habit created successfully!');
      discardInProgress.current = true;
      await clearProgress();
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      navigate('/');
    },
    onError: (error: any) => {
      showError(`Failed to create habit: ${error.message}`);
    },
  });

  const createTemplateMutation = useCreateTemplate();

  const handleSubmitFinal = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!wizardData.name?.trim() || !wizardData.habit_key?.trim()) {
      showError('Please ensure habit name and key are filled.');
      return;
    }

    const inferredParams = calculateHabitParams(wizardData, neurodivergentMode);

    const habitData: CreateHabitParams = {
      name: wizardData.name!,
      habit_key: wizardData.habit_key.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, ''),
      category: (wizardData.category as HabitCategory) || 'daily',
      unit: wizardData.unit || 'min',
      icon_name: wizardData.icon_name || 'Target',
      short_description: wizardData.short_description || '',
      ...inferredParams,
      weekly_session_min_duration: inferredParams.weekly_session_min_duration || 10,
    } as CreateHabitParams;

    if (isTemplateCreationMode) {
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
        measurement_type: habitData.measurement_type,
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

  useEffect(() => {
    if (discardInProgress.current || isDiscarding) return;

    if (isTemplateCreationMode || templateToPreFill || aiGeneratedData) {
      setSetupPath('guided');
      if (!hasLoadedInitialProgress) {
        if (aiGeneratedData) setWizardData(aiGeneratedData);
        else if (templateToPreFill) {
           const templateParams = calculateHabitParams({
             habit_key: templateToPreFill.id,
             name: templateToPreFill.name,
             category: templateToPreFill.category,
             unit: templateToPreFill.unit,
             icon_name: templateToPreFill.icon_name,
             short_description: templateToPreFill.shortDescription,
             is_trial_mode: templateToPreFill.defaultMode === 'Trial',
             is_fixed: templateToPreFill.defaultMode === 'Fixed',
             anchor_practice: templateToPreFill.anchorPractice,
             daily_goal: templateToPreFill.defaultDuration,
             frequency_per_week: templateToPreFill.defaultFrequency,
           } as any, neurodivergentMode);
           setWizardData(templateParams as any);
        }
        setHasLoadedInitialProgress(true);
      }
      return;
    }

    if (hasLoadedInitialProgress || isLoadingWizardProgress) return;

    if (wizardProgress && wizardProgress.habit_data) {
      setSetupPath('guided');
      setCurrentStep(wizardProgress.current_step);
      setWizardData(wizardProgress.habit_data);
      setCurrentMicroStepIndex(0);
      setHasLoadedInitialProgress(true);
    }
  }, [isLoadingWizardProgress, wizardProgress, isTemplateCreationMode, templateToPreFill, aiGeneratedData, hasLoadedInitialProgress, neurodivergentMode, isDiscarding]);

  useEffect(() => {
    if (!templateToPreFill && !aiGeneratedData && wizardData.name && !isDiscarding) {
      const key = wizardData.name.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
      setWizardData(prev => ({ ...prev, habit_key: key }));
    }
  }, [wizardData.name, templateToPreFill, aiGeneratedData, isDiscarding]);

  const handleSaveAndNext = useCallback(async (dataToSave: Partial<WizardHabitData>) => {
    if (isDiscarding) return;
    setIsSaving(true);
    try {
      const updatedWizardData = { ...wizardData, ...dataToSave };
      setWizardData(updatedWizardData);

      let nextMacroStep = currentStep;
      let nextMicroStepIdx = currentMicroStepIndex;

      const microStepsForCurrentMacro = MICRO_STEPS_MAP[currentStep];
      if (microStepsForCurrentMacro && nextMicroStepIdx < microStepsForCurrentMacro.length - 1) {
        nextMicroStepIdx++;
      } else {
        nextMacroStep++;
        nextMicroStepIdx = 0;
      }

      if (nextMacroStep > MACRO_STEPS[MACRO_STEPS.length - 1]) {
        nextMacroStep = MACRO_STEPS[MACRO_STEPS.length - 1];
        nextMicroStepIdx = 0;
      }

      await saveProgress({ current_step: nextMacroStep, habit_data: updatedWizardData });
      setCurrentStep(nextMacroStep);
      setCurrentMicroStepIndex(nextMicroStepIdx);
    } catch (error) {
      showError("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [wizardData, currentStep, currentMicroStepIndex, saveProgress, isDiscarding]);

  const handleBack = useCallback(async () => {
    if (currentStep === 1 && currentMicroStepIndex === 0) {
      setSetupPath('selection');
      return;
    }

    let prevMacroStep = currentStep;
    let prevMicroStepIdx = currentMicroStepIndex;

    if (prevMicroStepIdx > 0) {
      prevMicroStepIdx--;
    } else if (prevMacroStep > 1) {
      prevMacroStep--;
      const microStepsForPrevMacro = MICRO_STEPS_MAP[prevMacroStep];
      if (microStepsForPrevMacro) {
        prevMicroStepIdx = microStepsForPrevMacro.length - 1;
      } else {
        prevMicroStepIdx = 0;
      }
    }

    setCurrentStep(prevMacroStep);
    setCurrentMicroStepIndex(prevMicroStepIdx);
  }, [currentStep, currentMicroStepIndex]);

  const handleResetProgress = useCallback(async () => {
    try {
      setIsDiscarding(true);
      discardInProgress.current = true;
      await clearProgress();
      setWizardData({});
      setCurrentStep(1);
      setCurrentMicroStepIndex(0);
      setHasLoadedInitialProgress(false);
      setSetupPath('selection');
      discardInProgress.current = false; 
      setIsDiscarding(false);
      showSuccess('Progress cleared.');
    } catch (error) {
      showError('Failed to reset progress.');
      discardInProgress.current = false;
      setIsDiscarding(false);
    }
  }, [clearProgress]);

  const handleSaveAndFinishLater = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveProgress({ current_step: currentStep, habit_data: wizardData });
      showSuccess('Progress saved! You can continue later.');
      navigate('/');
    } catch (error) {
      showError('Failed to save progress.');
    } finally {
      setIsSaving(false);
      setShowExitDialog(false);
    }
  }, [currentStep, wizardData, saveProgress, navigate]);

  const handleDiscardDraft = useCallback(async () => {
    if (isDiscarding || isSaving) return;
    setIsDiscarding(true);
    discardInProgress.current = true; 
    setIsSaving(true);
    setHasLoadedInitialProgress(true); 

    try {
      await clearProgress();
      setWizardData({});
      setCurrentStep(1);
      setCurrentMicroStepIndex(0);
      showSuccess('Draft discarded.');
      navigate('/', { replace: true });
    } catch (error) {
      showError('Failed to discard draft.');
      discardInProgress.current = false; 
      setIsDiscarding(false);
      setIsSaving(false);
    } finally {
      setShowExitDialog(false);
    }
  }, [clearProgress, navigate, isDiscarding, isSaving]);

  const handleMacroStepClick = useCallback((stepNumber: number) => {
    if (isDiscarding) return;
    setCurrentStep(stepNumber);
    setCurrentMicroStepIndex(0);
  }, [isDiscarding]);

  const isMacroStepCompleted = useCallback((stepNumber: number) => {
    if (currentStep > stepNumber) return true;
    if (currentStep < stepNumber) return false;
    const microSteps = MICRO_STEPS_MAP[stepNumber];
    if (!microSteps) return false;
    return microSteps.every((microStepId, index) => index < currentMicroStepIndex);
  }, [currentStep, currentMicroStepIndex]);

  const totalDisplaySteps = MACRO_STEPS.reduce((acc, step) => acc + (MICRO_STEPS_MAP[step]?.length || 1), 0);
  
  const currentDisplayStep = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= currentStep; i++) {
      if (i < currentStep) {
        count += (MICRO_STEPS_MAP[i]?.length || 1);
      } else {
        count += (currentMicroStepIndex + 1);
      }
    }
    return count;
  }, [currentStep, currentMicroStepIndex]);

  const progress = (currentDisplayStep / totalDisplaySteps) * 100;

  const handleSkipMicroStep = useCallback((field: keyof WizardHabitData, defaultValue: any) => {
    if (isDiscarding) return;
    setWizardData(prev => ({
      ...prev,
      [field]: defaultValue,
      [`${String(field)}_skipped`]: true,
    }));
    handleSaveAndNext({
      [field]: defaultValue,
      [`${String(field)}_skipped`]: true,
    });
  }, [handleSaveAndNext, isDiscarding]);

  const isNextDisabled = useMemo(() => {
    if (currentStep === 1 && !wizardData.category) return true;
    if (currentStep === 2 && (!wizardData.motivation_type && !wizardData.motivation_type_skipped)) return true;

    if (currentStep >= 3 && currentStep <= 6) {
      const microStepId = MICRO_STEPS_MAP[currentStep]?.[currentMicroStepIndex];
      if (!microStepId) return true;

      switch (microStepId) {
        case '3.1': return (!wizardData.energy_per_session && !wizardData.energy_per_session_skipped);
        case '3.2': return (!wizardData.consistency_reality && !wizardData.consistency_reality_skipped);
        case '3.3': return (!wizardData.emotional_cost && !wizardData.emotional_cost_skipped);
        case '3.4': return (!wizardData.confidence_check && !wizardData.confidence_check_skipped);
        case '4.1': return (!wizardData.barriers || wizardData.barriers.length === 0) && !wizardData.barriers_skipped;
        case '4.2': return (!wizardData.missed_day_response && !wizardData.missed_day_response_skipped);
        case '4.3': return (!wizardData.sensitivity_setting && !wizardData.sensitivity_setting_skipped);
        case '5.1': return (!wizardData.time_of_day_fit && !wizardData.time_of_day_fit_skipped);
        case '5.2': return (!wizardData.dependency_check && !wizardData.dependency_check_skipped);
        case '5.3': return (!wizardData.time_pressure_check && !wizardData.time_pressure_check_skipped);
        case '6.1': return (!wizardData.growth_appetite && !wizardData.growth_appetite_skipped);
        case '6.2': return (!wizardData.growth_style && !wizardData.growth_style_skipped);
        case '6.3': return (!wizardData.failure_response && !wizardData.failure_response_skipped);
        case '6.4': return (!wizardData.success_definition && !wizardData.success_definition_skipped);
        default: return true;
      }
    }
    return false;
  }, [currentStep, currentMicroStepIndex, wizardData]);

  const handleHabitGenerated = (habitData: any) => {
    setWizardData(habitData);
    setSetupPath('guided');
    setCurrentStep(7); // Jump to review
  };

  const renderWizardStepContent = () => {
    if (currentStep === 1) return <HabitWizardStep1 wizardData={wizardData} setWizardData={setWizardData} />;
    if (currentStep === 2) return <HabitWizardStep2 wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;

    if (currentStep >= 3 && currentStep <= 6) {
      const microStepId = MICRO_STEPS_MAP[currentStep]?.[currentMicroStepIndex];
      switch (microStepId) {
        case '3.1': return <Step3_EnergyPerSession wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '3.2': return <Step3_ConsistencyReality wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '3.3': return <Step3_EmotionalCost wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '3.4': return <Step3_ConfidenceCheck wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '4.1': return <Step4_Barriers wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '4.2': return <Step4_MissedDayResponse wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '4.3': return <Step4_SensitivitySetting wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '5.1': return <Step5_TimeOfDayFit wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '5.2': return <Step5_DependencyCheck wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '5.3': return <Step5_TimePressureCheck wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '6.1': return <Step6_GrowthAppetite wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '6.2': return <Step6_GrowthStyle wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '6.3': return <Step6_FailureResponse wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        case '6.4': return <Step6_SuccessDefinition wizardData={wizardData} setWizardData={setWizardData} onSkip={handleSkipMicroStep} />;
        default: return null;
      }
    }

    if (currentStep === 7) {
      const inferredParams = calculateHabitParams(wizardData, neurodivergentMode);
      const fullWizardData = { ...wizardData, ...inferredParams };
      return (
        <HabitReviewStep
          wizardData={fullWizardData}
          onEditDetails={(data) => {
            setEditableHabitData(data);
            setShowEditDetailsModal(true);
          }}
          onSaveAndFinishLater={handleSaveAndFinishLater}
          onCreateHabit={handleSubmitFinal}
          onDiscardDraft={handleDiscardDraft}
          isSaving={isSaving}
          isCreating={createHabitMutation.isPending || createTemplateMutation.isPending}
          isTemplateMode={isTemplateCreationMode}
        />
      );
    }

    return null;
  };

  const isFinalStep = currentStep === MACRO_STEPS[MACRO_STEPS.length - 1];

  if (setupPath === 'selection') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <Compass className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic">Practice Lab</h1>
          <p className="text-muted-foreground max-w-lg mx-auto font-medium">
            How would you like to design your next habit?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card 
            className="rounded-[2.5rem] border-2 border-border hover:border-primary transition-all cursor-pointer group shadow-sm hover:shadow-xl"
            onClick={() => setSetupPath('guided')}
          >
            <CardContent className="p-10 space-y-6 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-secondary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Wand2 className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Guided Setup</h2>
                <p className="text-muted-foreground text-sm font-medium">
                  Let the coach interview you to design the perfect habit structure based on your energy and barriers.
                </p>
              </div>
              <Button variant="ghost" className="rounded-full gap-2 font-bold group-hover:translate-x-1 transition-transform">
                Start Guided <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="rounded-[2.5rem] border-2 border-border hover:border-primary transition-all cursor-pointer group shadow-sm hover:shadow-xl bg-primary/5"
            onClick={() => setIsAIDialogOpen(true)}
          >
            <CardContent className="p-10 space-y-6 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Brain className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">AI Quick Build</h2>
                <p className="text-muted-foreground text-sm font-w-full font-medium">
                  Just describe what you want in natural language and let the AI handle the complex logic.
                </p>
              </div>
              <Button className="rounded-full gap-2 font-bold group-hover:translate-x-1 transition-transform">
                Open AI Assistant <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <AIGenerativeDialogue 
          isOpen={isAIDialogOpen} 
          onClose={() => setIsAIDialogOpen(false)} 
          onHabitGenerated={handleHabitGenerated} 
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto px-4 py-8">
      <Card className="w-full max-w-5xl mx-auto shadow-2xl rounded-[3rem] overflow-hidden border-0 bg-card">
        <CardHeader className="pb-6 pt-10 px-10 bg-gradient-to-b from-primary/5 to-transparent relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-6 right-6 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setShowExitDialog(true)}
            disabled={isDiscarding || isSaving}
          >
            <X className="w-6 h-6" />
          </Button>

          <WizardStepper
            currentMacroStep={currentStep}
            totalMacroSteps={MACRO_STEPS.length}
            onStepClick={handleMacroStepClick}
            isStepCompleted={isMacroStepCompleted}
            stepLabels={MACRO_STEP_LABELS}
          />
          
          <div className="mt-8 space-y-4">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    Step {currentDisplayStep} of {totalDisplaySteps}
                  </div>
                </div>
                <div className="text-sm font-black text-primary">{Math.round(progress)}%</div>
             </div>
             <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                  style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        </CardHeader>

        <div className="flex flex-col min-h-[500px]">
          <CardContent className="flex-1 px-10 pt-6 pb-12 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              {renderWizardStepContent()}
            </div>
            
            {!isFinalStep && (
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-border/50 max-w-3xl mx-auto">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSaving || isDiscarding}
                  className="rounded-2xl h-14 px-8 font-bold gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>

                <Button
                  size="lg"
                  onClick={() => handleSaveAndNext({})}
                  disabled={isSaving || isNextDisabled || isDiscarding}
                  className="rounded-2xl h-14 px-12 text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Next <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase italic">Pause Design?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              We can save your progress in the lab as a draft, or clear it if you want to start fresh next time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="rounded-2xl h-12 flex-1 font-bold"
              onClick={() => setShowExitDialog(false)}
              disabled={isSaving || isDiscarding}
            >
              Continue Design
            </Button>
            <Button
              variant="secondary"
              className="rounded-2xl h-12 flex-1 font-bold"
              onClick={handleSaveAndFinishLater}
              disabled={isSaving || isDiscarding}
            >
              Save Draft
            </Button>
            <Button
              variant="destructive"
              className="rounded-2xl h-12 flex-1 font-bold"
              onClick={handleDiscardDraft}
              disabled={isSaving || isDiscarding}
            >
              Discard Draft
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditHabitDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        initialHabitData={editableHabitData}
        onSave={async (data) => {
          setIsSaving(true);
          try {
            const newWizardData = {
              ...wizardData,
              ...data,
              daily_goal: data.current_daily_goal || wizardData.daily_goal,
              weekly_session_min_duration: data.weekly_session_min_duration || wizardData.weekly_session_min_duration,
            };
            setWizardData(newWizardData);
            await saveProgress({ current_step: currentStep, habit_data: newWizardData });
            showSuccess('Details updated.');
            setShowEditDetailsModal(false);
          } catch (e) {
            showError('Update failed.');
          } finally {
            setIsSaving(false);
          }
        }}
        isSaving={isSaving}
        isTemplateMode={isTemplateCreationMode}
      />
    </div>
  );
};

export default HabitWizard;