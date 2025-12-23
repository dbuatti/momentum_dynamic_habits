"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
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

import { habitTemplates, HabitTemplate } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserHabitRecord, HabitCategoryType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';
import { useUserHabitWizardTemp, WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

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
  carryover_enabled: boolean;
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

  const { error } = await supabase.from('user_habits').upsert(habitToInsert, { onConflict: 'user_id, habit_key' });

  if (error) throw error;
  return { success: true };
};

const MICRO_STEPS = [
  '3.1', '3.2', '3.3', '3.4',
  '4.1', '4.2', '4.3',
  '5.1', '5.2', '5.3',
  '6.1', '6.2', '6.3', '6.4',
];

const calculateHabitParams = (data: Partial<WizardHabitData>): Partial<CreateHabitParams> => {
  let dailyGoal = 15;
  let frequency = 3;

  if (data.energy_per_session === 'very_little') dailyGoal = 5;
  if (data.energy_per_session === 'a_bit') dailyGoal = 10;
  if (data.energy_per_session === 'moderate') dailyGoal = 20;
  if (data.energy_per_session === 'plenty') dailyGoal = 30;

  if (data.consistency_reality === '1-2_days') frequency = 2;
  if (data.consistency_reality === '3-4_days') frequency = 3;
  if (data.consistency_reality === 'most_days') frequency = 5;
  if (data.consistency_reality === 'daily') frequency = 7;

  let isTrial = false;
  let isFixed = false;
  let plateauDays = 7;

  const confidence = data.confidence_check || 5;
  if (confidence < 4) plateauDays = 14;
  else if (confidence > 7) plateauDays = 5;

  if (data.emotional_cost === 'heavy') isTrial = true;

  if (data.growth_appetite === 'steady') isFixed = true;

  const autoChunking = data.energy_per_session === 'plenty' || data.energy_per_session === 'moderate';
  const anchorPractice = data.motivation_type === 'routine_building' || data.motivation_type === 'stress_reduction';

  let xpPerUnit = 30;
  let energyCostPerUnit = 6;
  if (data.unit === 'reps') { xpPerUnit = 1; energyCostPerUnit = 0.5; }
  if (data.unit === 'dose') { xpPerUnit = 10; energyCostPerUnit = 0; }

  let windowStart = null;
  let windowEnd = null;
  if (data.time_of_day_fit === 'morning') { windowStart = '06:00'; windowEnd = '10:00'; }
  if (data.time_of_day_fit === 'afternoon') { windowStart = '10:00'; windowEnd = '14:00'; }
  if (data.time_of_day_fit === 'evening') { windowStart = '18:00'; windowEnd = '22:00'; }

  const carryoverEnabled = data.time_pressure_check === 'only_if_time' || data.time_pressure_check === 'decide_later';

  return {
    current_daily_goal: dailyGoal,
    frequency_per_week: frequency,
    is_trial_mode: isTrial,
    is_fixed: isFixed,
    anchor_practice: anchorPractice,
    auto_chunking: autoChunking,
    xp_per_unit: xpPerUnit,
    energy_cost_per_unit: energyCostPerUnit,
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

  const [currentStep, setCurrentStep] = useState(1);
  const [currentMicroStep, setCurrentMicroStep] = useState(0);
  const [wizardData, setWizardData] = useState<Partial<WizardHabitData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedInitialProgress, setHasLoadedInitialProgress] = useState(false);

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
        default_chunks: 1,
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

  useEffect(() => {
    if (!isLoadingWizardProgress && wizardProgress && !hasLoadedInitialProgress && !isTemplateCreationMode && !templateToPreFill) {
      setCurrentStep(wizardProgress.current_step);
      setWizardData(wizardProgress.habit_data);
      if (wizardProgress.current_step > 2) {
        setCurrentMicroStep(0);
      }
      setHasLoadedInitialProgress(true);
    } else if (!isLoadingWizardProgress && (isTemplateCreationMode || templateToPreFill) && !hasLoadedInitialProgress) {
      setCurrentStep(99);
      if (templateToPreFill) {
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
      setHasLoadedInitialProgress(true);
    }
  }, [isLoadingWizardProgress, wizardProgress, isTemplateCreationMode, templateToPreFill, hasLoadedInitialProgress]);

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

      let nextStep = currentStep;
      let nextMicroIndex = currentMicroStep;
      let shouldSaveProgress = true;

      if (currentStep === 1) {
        nextStep = 2;
      } else if (currentStep === 2) {
        nextStep = 3;
        nextMicroIndex = 0;
      } else if (currentStep === 3) {
        if (currentMicroStep < MICRO_STEPS.length - 1) {
          nextMicroIndex = currentMicroStep + 1;
        } else {
          if (isTemplateCreationMode) {
            shouldSaveProgress = false;
            handleSubmitFinal();
            return;
          } else {
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
            shouldSaveProgress = false;
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
      showError("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [wizardData, currentStep, currentMicroStep, saveProgress, isTemplateCreationMode, createHabitMutation, handleSubmitFinal]);

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
      if (currentMicroStep > 0) {
        prevMicroIndex = currentMicroStep - 1;
      } else {
        prevStep = 2;
      }
    }

    setCurrentStep(prevStep);
    setCurrentMicroStep(prevMicroIndex);
  }, [currentStep, currentMicroStep, deleteProgress, navigate]);

  const handleResetProgress = useCallback(async () => {
    try {
      await deleteProgress();
      setWizardData({});
      setCurrentStep(1);
      setCurrentMicroStep(0);
      setHasLoadedInitialProgress(false);
      showSuccess('Wizard progress reset.');
    } catch (error) {
      showError('Failed to reset progress.');
    }
  }, [deleteProgress]);

  const totalDisplaySteps = isTemplateCreationMode ? 1 : (2 + MICRO_STEPS.length);
  const currentDisplayStep = useMemo(() => {
    if (isTemplateCreationMode) return 1;
    if (currentStep === 1) return 1;
    if (currentStep === 2) return 2;
    if (currentStep === 3) return 2 + currentMicroStep + 1;
    return 1;
  }, [currentStep, currentMicroStep, isTemplateCreationMode]);
  const progress = (currentDisplayStep / totalDisplaySteps) * 100;

  const isNextDisabled = useMemo(() => {
    if (currentStep === 1 && !wizardData.category) return true;
    if (currentStep === 2 && !wizardData.motivation_type) return true;

    if (currentStep === 3) {
      const stepId = MICRO_STEPS[currentMicroStep];
      if (stepId === '3.1' && !wizardData.energy_per_session) return true;
      if (stepId === '3.2' && !wizardData.consistency_reality) return true;
      if (stepId === '3.3' && !wizardData.emotional_cost) return true;
      if (stepId === '3.4' && !wizardData.confidence_check) return true;
      if (stepId === '4.1' && (!wizardData.barriers || wizardData.barriers.length === 0)) return true;
      if (stepId === '4.2' && !wizardData.missed_day_response) return true;
      if (stepId === '4.3' && !wizardData.sensitivity_setting) return true;
      if (stepId === '5.1' && !wizardData.time_of_day_fit) return true;
      if (stepId === '5.2' && !wizardData.dependency_check) return true;
      if (stepId === '5.3' && !wizardData.time_pressure_check) return true;
      if (stepId === '6.1' && !wizardData.growth_appetite) return true;
      if (stepId === '6.2' && !wizardData.growth_style) return true;
      if (stepId === '6.3' && !wizardData.failure_response) return true;
      if (stepId === '6.4' && !wizardData.success_definition) return true;
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
    if (currentStep === 1) return <HabitWizardStep1 wizardData={wizardData} setWizardData={setWizardData} />;
    if (currentStep === 2) return <HabitWizardStep2 wizardData={wizardData} setWizardData={setWizardData} />;

    if (currentStep === 3) {
      const stepId = MICRO_STEPS[currentMicroStep];
      switch (stepId) {
        case '3.1': return <Step3_EnergyPerSession wizardData={wizardData} setWizardData={setWizardData} />;
        case '3.2': return <Step3_ConsistencyReality wizardData={wizardData} setWizardData={setWizardData} />;
        case '3.3': return <Step3_EmotionalCost wizardData={wizardData} setWizardData={setWizardData} />;
        case '3.4': return <Step3_ConfidenceCheck wizardData={wizardData} setWizardData={setWizardData} />;
        case '4.1': return <Step4_Barriers wizardData={wizardData} setWizardData={setWizardData} />;
        case '4.2': return <Step4_MissedDayResponse wizardData={wizardData} setWizardData={setWizardData} />;
        case '4.3': return <Step4_SensitivitySetting wizardData={wizardData} setWizardData={setWizardData} />;
        case '5.1': return <Step5_TimeOfDayFit wizardData={wizardData} setWizardData={setWizardData} />;
        case '5.2': return <Step5_DependencyCheck wizardData={wizardData} setWizardData={setWizardData} />;
        case '5.3': return <Step5_TimePressureCheck wizardData={wizardData} setWizardData={setWizardData} />;
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

  const isLastMicroStep = currentStep === 3 && currentMicroStep === MICRO_STEPS.length - 1;
  const buttonText = isLastMicroStep ? 'Create Habit' : 'Next';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <PageHeader title={isTemplateCreationMode ? "Contribute New Template" : "Habit Wizard"} />

      {/* Clean single card matching the screenshot style */}
      <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur border-0 shadow-2xl rounded-3xl overflow-hidden">
        {/* Progress Header */}
        {!isTemplateCreationMode && (
          <CardHeader className="pt-8 pb-6 px-10">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Step {currentDisplayStep} of {totalDisplaySteps}
              </div>
              <div className="text-sm font-bold text-primary">{Math.round(progress)}%</div>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>
        )}

        {/* Main Content */}
        <CardContent className="px-10 pb-10">
          <div className="min-h-[420px] flex flex-col justify-between">
            <div className="space-y-8">
              {renderWizardStepContent()}
            </div>

            {/* Fixed button section inside the card */}
            {!isTemplateCreationMode && (
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-border/30">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSaving || (currentStep === 1 && currentMicroStep === 0)}
                  className="rounded-full px-10 py-6 text-base border-muted-foreground/30"
                >
                  Back
                </Button>

                <Button
                  size="lg"
                  onClick={() => handleSaveAndNext({})}
                  disabled={isSaving || isNextDisabled}
                  className="rounded-full px-12 py-6 text-base font-medium shadow-lg bg-primary hover:bg-primary/90"
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset button below card */}
      {wizardProgress && !isTemplateCreationMode && (
        <div className="flex justify-center mt-10">
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
    </div>
  );
};

export default HabitWizard;