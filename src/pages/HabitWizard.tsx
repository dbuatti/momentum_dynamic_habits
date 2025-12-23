"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
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
import { UserHabitRecord, HabitCategory } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';
import { useUserHabitWizardTemp, WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { calculateHabitParams } from '@/utils/habit-wizard-utils';

// Macro Steps
import { HabitWizardStep1 } from '@/components/habits/wizard/HabitWizardStep1';
import { HabitWizardStep2 } from '@/components/habits/wizard/HabitWizardStep2';

// Micro Steps
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
  unit: 'min' | 'reps' | 'dose';
  xp_per_unit: number;
  energy_cost_per_unit: number;
  icon_name: string;
  dependent_on_habit_id: string | null;
  plateau_days_required: number;
  window_start: string | null;
  window_end: string | null;
  carryover_enabled: boolean;
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

const MACRO_STEPS = [1, 2, 3, 4, 5, 6, 7]; // Added step 7 for review
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
  7: ['review'], // Single micro-step for review
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

  const [currentStep, setCurrentStep] = useState(1);
  const [currentMicroStepIndex, setCurrentMicroStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState<Partial<WizardHabitData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedInitialProgress, setHasLoadedInitialProgress] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editableHabitData, setEditableHabitData] = useState<Partial<CreateHabitParams>>({});


  const createHabitMutation = useMutation({
    mutationFn: (habit: CreateHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createNewHabit({ userId: session.user.id, habit, neurodivergentMode });
    },
    onSuccess: async () => {
      showSuccess('Habit created successfully!');
      await deleteProgress();
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

    if (!wizardData.name?.trim() || !wizardData.habit_key?.trim() || (wizardData.daily_goal || 0) <= 0 || (wizardData.frequency_per_week || 0) <= 0) {
      showError('Please ensure all required habit details are filled with valid values.');
      return;
    }

    if (isTemplateCreationMode && !wizardData.short_description?.trim()) {
      showError('Please provide a short description for your template.');
      return;
    }

    const inferredParams = calculateHabitParams(wizardData, neurodivergentMode);

    const habitData: CreateHabitParams = {
      name: wizardData.name!,
      habit_key: wizardData.habit_key.toLowerCase().replace(/\s/g, '_'),
      category: wizardData.category as HabitCategory,
      unit: wizardData.unit || 'min',
      icon_name: wizardData.icon_name || 'Target',
      short_description: wizardData.short_description || '',
      ...inferredParams,
    } as CreateHabitParams;

    if (isTemplateCreationMode) {
      createTemplateMutation.mutate({
        id: habitData.habit_key,
        name: habitData.name,
        category: habitData.category, // Removed .toString()
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
        is_public: true,
      });
    } else {
      createHabitMutation.mutate(habitData);
    }
  };

  useEffect(() => {
    if (!isLoadingWizardProgress && wizardProgress && !hasLoadedInitialProgress && !isTemplateCreationMode && !templateToPreFill) {
      setCurrentStep(wizardProgress.current_step);
      setWizardData(wizardProgress.habit_data);
      setCurrentMicroStepIndex(0); // Reset micro-step index when loading a macro step
      setHasLoadedInitialProgress(true);
    } else if (!isLoadingWizardProgress && (isTemplateCreationMode || templateToPreFill) && !hasLoadedInitialProgress) {
      // This block is now effectively unused as template creation is handled by NewHabitModal
      // and template pre-fill is handled by NewHabitModal directly.
      // The HabitWizard page is now exclusively for personal habit creation.
      setHasLoadedInitialProgress(true); // Mark as loaded to prevent re-entry
      navigate('/'); // Redirect if somehow landed here in template mode
    }
  }, [isLoadingWizardProgress, wizardProgress, isTemplateCreationMode, templateToPreFill, hasLoadedInitialProgress, navigate]);

  useEffect(() => {
    if (!templateToPreFill && wizardData.name) {
      const key = wizardData.name.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
      setWizardData(prev => ({ ...prev, habit_key: key }));
    }
  }, [wizardData.name, templateToPreFill]);

  const handleSaveAndNext = useCallback(async (dataToSave: Partial<WizardHabitData>) => {
    setIsSaving(true);
    try {
      const updatedWizardData = { ...wizardData, ...dataToSave };
      setWizardData(updatedWizardData); // Update local state immediately

      let nextMacroStep = currentStep;
      let nextMicroStepIdx = currentMicroStepIndex;
      let shouldSaveProgress = true;

      if (currentStep >= 1 && currentStep <= 6) { // Handle micro-steps within macro steps 1-6
        const microStepsForCurrentMacro = MICRO_STEPS_MAP[currentStep];
        if (microStepsForCurrentMacro && nextMicroStepIdx < microStepsForCurrentMacro.length - 1) {
          nextMicroStepIdx++;
        } else {
          // Move to next macro step
          nextMacroStep++;
          nextMicroStepIdx = 0;
        }
      }

      if (nextMacroStep > MACRO_STEPS[MACRO_STEPS.length - 1]) { // All steps completed, including review
        // This case should ideally not be reached if the final action is handled in HabitReviewStep
        // But as a fallback, if somehow we pass the review step, finalize.
        // This path is now only for personal habit creation.
        const inferredParams = calculateHabitParams(updatedWizardData, neurodivergentMode);
        const finalHabitData: CreateHabitParams = {
          name: updatedWizardData.name!,
          habit_key: updatedWizardData.habit_key!,
          category: updatedWizardData.category as HabitCategory,
          unit: updatedWizardData.unit || 'min',
          icon_name: updatedWizardData.icon_name || 'Target',
          ...inferredParams,
        } as CreateHabitParams;

        await createHabitMutation.mutateAsync(finalHabitData);
        shouldSaveProgress = false;
        return;
      }

      if (shouldSaveProgress) {
        await saveProgress({ current_step: nextMacroStep, habit_data: updatedWizardData });
        setCurrentStep(nextMacroStep);
        setCurrentMicroStepIndex(nextMicroStepIdx);
      }
    } catch (error) {
      showError("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [wizardData, currentStep, currentMicroStepIndex, saveProgress, createHabitMutation, handleSubmitFinal, neurodivergentMode]);

  const handleBack = useCallback(async () => {
    if (currentStep === 1 && currentMicroStepIndex === 0) {
      await deleteProgress();
      navigate('/');
      return;
    }

    let prevMacroStep = currentStep;
    let prevMicroStepIdx = currentMicroStepIndex;

    if (prevMicroStepIdx > 0) {
      prevMicroStepIdx--;
    } else if (prevMacroStep > 1) {
      prevMacroStep--;
      // When going back to a macro step, set micro-step index to the last one of that macro step
      const microStepsForPrevMacro = MICRO_STEPS_MAP[prevMacroStep];
      if (microStepsForPrevMacro) {
        prevMicroStepIdx = microStepsForPrevMacro.length - 1;
      } else {
        prevMicroStepIdx = 0;
      }
    }

    setCurrentStep(prevMacroStep);
    setCurrentMicroStepIndex(prevMicroStepIdx);
  }, [currentStep, currentMicroStepIndex, deleteProgress, navigate]);

  const handleResetProgress = useCallback(async () => {
    try {
      await deleteProgress();
      setWizardData({});
      setCurrentStep(1);
      setCurrentMicroStepIndex(0);
      setHasLoadedInitialProgress(false);
      showSuccess('Wizard progress reset.');
    } catch (error) {
      showError('Failed to reset progress.');
    }
  }, [deleteProgress]);

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
    }
  }, [currentStep, wizardData, saveProgress, navigate]);

  const handleCancelWizard = useCallback(async () => {
    setIsSaving(true); // Use isSaving to disable buttons during deletion
    try {
      await deleteProgress();
      showSuccess('Wizard progress discarded.');
      navigate('/');
    } catch (error) {
      showError('Failed to discard progress.');
    } finally {
      setIsSaving(false);
    }
  }, [deleteProgress, navigate]);

  const handleMacroStepClick = useCallback((stepNumber: number) => {
    // Allow navigating to any macro step, forward or backward
    setCurrentStep(stepNumber);
    setCurrentMicroStepIndex(0); // Always start from the first micro-step of the chosen macro step
  }, []);

  const isMacroStepCompleted = useCallback((stepNumber: number) => {
    return currentStep > stepNumber;
  }, [currentStep]);

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
    setWizardData(prev => ({
      ...prev,
      [field]: defaultValue,
      [`${String(field)}_skipped`]: true,
    }));
    handleSaveAndNext({
      [field]: defaultValue,
      [`${String(field)}_skipped`]: true,
    });
  }, [handleSaveAndNext]);

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
    // For the review step (Step 7), the "Create Habit" button is handled by HabitReviewStep itself
    // and its disabled state is based on form validity.
    if (currentStep === 7) {
      return !wizardData.name?.trim() || !wizardData.habit_key?.trim() || !wizardData.category;
    }
    return false;
  }, [currentStep, currentMicroStepIndex, wizardData]);

  const handleUpdateHabitFromModal = useCallback(async (updatedData: Partial<CreateHabitParams>) => {
    setIsSaving(true);
    try {
      // Update wizardData with the changes from the modal
      setWizardData(prev => ({
        ...prev,
        ...updatedData,
        // Ensure category is correctly typed if it comes from CreateHabitParams
        category: updatedData.category as HabitCategory,
      }));
      // Also save this updated state to Supabase temp storage
      await saveProgress({ current_step: currentStep, habit_data: { ...wizardData, ...updatedData } });
      showSuccess('Habit details updated!');
      setShowEditDetailsModal(false);
    } catch (error) {
      showError('Failed to update habit details.');
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, wizardData, saveProgress]);

  if (isLoadingWizardProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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
        default: return <div className="text-center text-muted-foreground">Unknown Micro Step</div>;
      }
    }

    if (currentStep === 7) { // New review step
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
          onCancel={handleCancelWizard}
          isSaving={isSaving}
          isCreating={createHabitMutation.isPending || createTemplateMutation.isPending}
          isTemplateMode={isTemplateCreationMode}
        />
      );
    }

    // This case should ideally not be reached if template creation is handled by NewHabitModal
    // and the wizard is only for personal habits.
    return null;
  };

  const isLastMicroStep = currentStep >= 1 && currentStep <= 6 && currentMicroStepIndex === (MICRO_STEPS_MAP[currentStep]?.length || 0) - 1;
  const isFinalStep = currentStep === MACRO_STEPS[MACRO_STEPS.length - 1]; // Check if it's the final macro step (review)

  const buttonText = isFinalStep ? 'Create Habit' : 'Next';

  return (
    <div className="w-full max-w-full mx-auto px-4 py-8"> {/* Changed max-w-4xl to max-w-full */}
      {/* Removed PageHeader */}

      {/* Single clean card with fixed layout */}
      <Card className="w-full max-w-6xl mx-auto shadow-2xl rounded-3xl overflow-hidden border-0 bg-card"> {/* Changed max-w-4xl to max-w-6xl */}
        {/* Header with progress - always present and fixed height */}
        {/* Removed conditional rendering for isTemplateCreationMode as this page is now only for personal habits */}
        <CardHeader className="pb-6 pt-8 px-10 bg-gradient-to-b from-primary/5 to-transparent">
          <WizardStepper
            currentMacroStep={currentStep}
            totalMacroSteps={MACRO_STEPS.length}
            onStepClick={handleMacroStepClick}
            isStepCompleted={isMacroStepCompleted}
            stepLabels={MACRO_STEP_LABELS}
          />
          <div className="flex justify-between items-center mb-4 mt-6"> {/* Added mt-6 for spacing */}
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Step {currentDisplayStep} of {totalDisplaySteps}
            </div>
            <div className="text-sm font-bold text-primary">{Math.round(progress)}%</div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        {/* Main content + fixed bottom button bar */}
        <div className="flex flex-col min-h-[600px]">
          {/* Scrollable content area */}
          <CardContent className="flex-1 px-10 pt-6 pb-32 overflow-y-auto">
            {renderWizardStepContent()}
          </CardContent>

          {/* Fixed button bar at the bottom - never moves */}
          {!isFinalStep && ( // Hide default buttons on final review step
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 shadow-lg">
              <div className="max-w-2xl mx-auto px-10 py-6 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSaving || (currentStep === 1 && currentMicroStepIndex === 0)}
                  className="rounded-2xl px-10 py-6 text-base"
                >
                  Back
                </Button>

                <Button
                  size="lg"
                  onClick={() => handleSaveAndNext({})}
                  disabled={isSaving || isNextDisabled}
                  className="rounded-2xl px-14 py-6 text-base font-semibold shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    buttonText
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Reset progress button below the card */}
      {wizardProgress && (
        <div className="flex justify-center mt-12">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Wizard Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your saved progress and restart the wizard from the beginning.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetProgress} className="rounded-xl bg-destructive hover:bg-destructive/90">
                  Reset Progress
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Edit Habit Details Modal */}
      <EditHabitDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        initialHabitData={editableHabitData}
        onSave={handleUpdateHabitFromModal}
        isSaving={isSaving}
        isTemplateMode={isTemplateCreationMode}
      />
    </div>
  );
};

export default HabitWizard;