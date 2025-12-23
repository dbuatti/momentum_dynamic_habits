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
import { HabitWizardStep1, HabitWizardStep2, HabitWizardStep3, HabitWizardStep4, HabitWizardStep5, HabitWizardStep6, HabitTemplateForm } from '@/components/habits/wizard'; // Import Step 6

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
  const [wizardData, setWizardData] = useState<Partial<WizardHabitData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing wizard progress on mount
  useEffect(() => {
    if (!isLoadingWizardProgress && wizardProgress && !isTemplateCreationMode && !templateToPreFill) {
      setCurrentStep(wizardProgress.current_step);
      setWizardData(wizardProgress.habit_data);
    } else if (isTemplateCreationMode || templateToPreFill) {
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
    if (!templateToPreFill && wizardData.name) {
      const key = wizardData.name.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, '');
      setWizardData(prev => ({ ...prev, habit_key: key }));
    }
  }, [wizardData.name, wizardData.habit_key, templateToPreFill]);

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

  const totalGuidedSteps = 6;
  const progress = (currentStep / totalGuidedSteps) * 100;

  // Move this useMemo BEFORE the conditional return
  const isNextDisabled = useMemo(() => {
    if (currentStep === 1 && !wizardData.category) return true;
    if (currentStep === 2 && !wizardData.motivation_type) return true;
    if (currentStep === 3 && (!wizardData.session_duration || !wizardData.weekly_frequency)) return true;
    // Step 4 is optional, so no validation needed
    // Step 5 is optional, so no validation needed
    // Step 6 is optional, so no validation needed
    return false;
  }, [currentStep, wizardData]);

  if (isLoadingWizardProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const renderWizardStepContent = () => {
    switch (currentStep) {
      case 1:
        return <HabitWizardStep1 wizardData={wizardData} setWizardData={setWizardData} />;
      case 2:
        return <HabitWizardStep2 wizardData={wizardData} setWizardData={setWizardData} />;
      case 3:
        return <HabitWizardStep3 wizardData={wizardData} setWizardData={setWizardData} />;
      case 4:
        return <HabitWizardStep4 wizardData={wizardData} setWizardData={setWizardData} />;
      case 5:
        return <HabitWizardStep5 wizardData={wizardData} setWizardData={setWizardData} />;
      case 6:
        return <HabitWizardStep6 wizardData={wizardData} setWizardData={setWizardData} />;
      case 99: // Template creation form
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
      default:
        return <div className="text-center text-muted-foreground">Unknown Step</div>;
    }
  };

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
          {renderWizardStepContent()}

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