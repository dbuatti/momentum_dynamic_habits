"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  Calendar, Timer, Settings, LayoutTemplate, X
} from 'lucide-react';
import { habitTemplates, habitCategories, habitUnits, habitModes, habitIcons, HabitTemplate } from '@/lib/habit-templates';
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
// import { NewHabitModal } from '@/components/habits/NewHabitModal'; // Removed as it's no longer used here

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

const HabitWizard = () => { // Renamed component
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  // Determine flow type from location state or default
  const isTemplateCreationMode = location.state?.mode === 'template';
  const templateToPreFill: HabitTemplate | undefined = location.state?.templateToPreFill;

  // const [flowType, setFlowType] = useState<'entry' | 'guided'>('entry'); // Removed entry screen
  const [step, setStep] = useState(1); // Start directly at step 1 for guided flow

  // Habit state for guided flow
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
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
  const [shortDescription, setShortDescription] = useState('');

  // New state for guided flow: selected category group
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string | null>(null);

  // Modal state for custom habit creation (removed from this file, but kept for reference if needed elsewhere)
  // const [showNewHabitModal, setShowNewHabitModal] = useState(false);

  const otherHabits = useMemo(() => {
    return (journeyData?.allHabits || []).filter(h => h.id !== habitKey);
  }, [journeyData?.allHabits, habitKey]);

  const selectedDependentHabit = useMemo(() => {
    if (!dependentOnHabitId) return null;
    return otherHabits.find(h => h.id === dependentOnHabitId);
  }, [dependentOnHabitId, otherHabits]);

  const selectedTemplate = useMemo(() => {
    if (selectedTemplateId === 'custom_habit') {
      return {
        id: 'custom_habit',
        name: 'Custom Habit',
        category: 'daily',
        defaultFrequency: 3,
        defaultDuration: 15,
        defaultMode: 'Trial',
        defaultChunks: 1,
        autoChunking: true,
        anchorPractice: false,
        unit: 'min',
        xpPerUnit: 30,
        energyCostPerUnit: 6,
        icon_name: 'Target',
        plateauDaysRequired: 7,
        shortDescription: "Design a habit tailored to your unique needs.",
      } as HabitTemplate;
    }
    return habitTemplates.find(t => t.id === selectedTemplateId);
  }, [selectedTemplateId]);

  // Pre-fill form if a template is passed via state
  useEffect(() => {
    if (templateToPreFill) {
      // setFlowType('guided'); // Switch to guided flow for pre-filling
      setStep(2); // Go to template selection step
      setSelectedTemplateId(templateToPreFill.id);
    } else if (isTemplateCreationMode) {
      // setFlowType('guided'); // Force guided flow for template contribution
      setStep(1); // Start at template selection
    }
  }, [templateToPreFill, isTemplateCreationMode]);

  // Update form fields when a template is selected in guided flow
  useEffect(() => {
    if (selectedTemplate) { // Removed flowType === 'guided' condition
      setHabitName(selectedTemplate.name);
      setHabitKey(selectedTemplate.id);
      setCategory(selectedTemplate.category);
      setDailyGoal(selectedTemplate.defaultDuration);
      setFrequency(selectedTemplate.defaultFrequency);
      setIsTrialMode(selectedTemplate.defaultMode === 'Trial');
      setIsFixed(selectedTemplate.defaultMode === 'Fixed');
      setIsAnchorPractice(selectedTemplate.anchorPractice);
      setAutoChunking(selectedTemplate.autoChunking);
      setUnit(selectedTemplate.unit);
      setXpPerUnit(templateToPreFill?.xpPerUnit || selectedTemplate.xpPerUnit);
      setEnergyCostPerUnit(templateToPreFill?.energyCostPerUnit || selectedTemplate.energyCostPerUnit);
      setSelectedIconName(selectedTemplate.icon_name);
      setPlateauDaysRequired(selectedTemplate.plateauDaysRequired);
      setShortDescription(templateToPreFill?.shortDescription || selectedTemplate.shortDescription || '');
    }
  }, [selectedTemplate, templateToPreFill]); // Removed flowType from dependency array

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
      navigate('/');
    },
    onError: (error) => {
      showError(`Failed to create habit: ${error.message}`);
    },
  });

  const createTemplateMutation = useCreateTemplate();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!habitName.trim() || !habitKey.trim() || dailyGoal <= 0 || frequency <= 0 || xpPerUnit <= 0 || energyCostPerUnit < 0) {
      showError('Please fill in all required fields with valid values.');
      return;
    }

    if (isTemplateCreationMode && !shortDescription.trim()) {
      showError('Please provide a short description for your template.');
      return;
    }

    const habitData = {
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
    };

    if (isTemplateCreationMode) {
      createTemplateMutation.mutate({
        id: habitKey.toLowerCase().replace(/\s/g, '_'),
        name: habitName,
        category: category.toString(),
        default_frequency: frequency,
        default_duration: dailyGoal,
        default_mode: isFixed ? 'Fixed' : (isTrialMode ? 'Trial' : 'Growth'),
        default_chunks: 1,
        auto_chunking: autoChunking,
        anchor_practice: isAnchorPractice,
        unit: unit,
        xp_per_unit: xpPerUnit,
        energy_cost_per_unit: energyCostPerUnit,
        icon_name: selectedIconName,
        plateau_days_required: plateauDaysRequired,
        short_description: shortDescription,
        is_public: true,
      });
    } else {
      createHabitMutation.mutate(habitData);
    }
  };

  const handleGuidedNext = () => {
    if (step === 4) { // Finalize step
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleGuidedBack = () => {
    if (step === 1) { // If on first step of guided flow, go back to mode selection
      // setFlowType('entry'); // No entry screen anymore
      // setStep(0); // No step 0 anymore
      navigate('/'); // Go back to dashboard if on first step
      setSelectedCategoryGroup(null);
      setSelectedTemplateId(null);
    } else if (step === 2) { // If on Template Selection, go back to Focus Area
      setSelectedTemplateId(null);
      setStep(step - 1);
    } else { // For other steps in guided flow
      setStep(step - 1);
    }
  };

  // Group templates by the requested categories
  const groupedTemplates = useMemo(() => {
    const groups: { [key: string]: { label: string; icon: React.ElementType; templates: HabitTemplate[] } } = {
      'learning_growth': { label: 'Learning & Growth', icon: BookOpen, templates: [] },
      'wellbeing_movement': { label: 'Wellbeing & Movement', icon: Wind, templates: [] },
      'daily_essentials': { label: 'Daily Essentials', icon: Home, templates: [] },
    };

    habitTemplates.filter(t => t.id !== 'custom_habit').forEach(template => {
      if (template.category === 'cognitive' && (template.id === 'study_generic' || template.id === 'creative_practice_generic')) {
        groups['learning_growth'].templates.push(template);
      } else if (template.category === 'physical' || template.category === 'wellness') {
        if (template.id === 'exercise_generic' || template.id === 'mindfulness_generic') {
          groups['wellbeing_movement'].templates.push(template);
        }
      } else if (template.category === 'daily' || template.defaultMode === 'Fixed') {
        if (template.id === 'daily_task_generic' || template.id === 'fixed_medication' || template.id === 'fixed_teeth_brushing') {
          groups['daily_essentials'].templates.push(template);
        }
      }
    });
    return groups;
  }, []);

  const renderGuidedStep = () => {
    const IconComponent = getHabitIconComponent(selectedIconName);
    const totalGuidedSteps = 4;
    const currentGuidedStep = step;
    const progress = (currentGuidedStep / totalGuidedSteps) * 100;

    return (
      <Card className="w-full max-w-md mx-auto shadow-xl rounded-3xl overflow-hidden border-0">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {currentGuidedStep} of {totalGuidedSteps}</div>
            <div className="text-xs font-bold text-primary">{Math.round(progress)}%</div>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
        </CardHeader>
        <CardContent className="py-8">
          {/* Step 1: Focus Area */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">What type of habit do you want to focus on?</h2>
                <p className="text-muted-foreground">Choose a category to see suggested templates.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(groupedTemplates).map(([key, group]) => {
                  const GroupIcon = group.icon;
                  const isSelected = selectedCategoryGroup === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        "border rounded-xl p-4 cursor-pointer transition-all text-left",
                        isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedCategoryGroup(key)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary"><GroupIcon className="w-5 h-5" /></div>
                        <span className="text-base font-bold">{group.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {step === 2 && selectedCategoryGroup && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Select a Template</h2>
                <p className="text-muted-foreground">Choose a habit to get started quickly.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {groupedTemplates[selectedCategoryGroup]?.templates.map((template) => {
                  const TemplateIcon = getHabitIconComponent(template.icon_name);
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={cn(
                        "h-auto p-4 rounded-2xl flex items-start gap-4 text-left transition-all border-2",
                        isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                        <TemplateIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{template.shortDescription}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.defaultDuration} {template.unit} • {template.defaultFrequency}x/week
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Customize */}
          {step === 3 && selectedTemplate && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Customize Your Habit</h2>
                <p className="text-muted-foreground">Adjust the details to fit your needs. (Optional)</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="dailyGoal">Daily Goal ({unit})</Label>
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
                <div className="space-y-3">
                  <Label htmlFor="frequency">Weekly Frequency</Label>
                  <Slider
                    id="frequency"
                    min={1}
                    max={7}
                    step={1}
                    value={[frequency]}
                    onValueChange={(val) => setFrequency(val[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1x</span>
                    <span>{frequency} times per week</span>
                    <span>7x</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 ml-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <Label className="text-[10px] font-black uppercase opacity-60">Window Start</Label>
                     </div>
                     <Select value={windowStart || ''} onValueChange={setWindowStart}>
                        <SelectTrigger id="windowStart" className="h-12 rounded-xl"><SelectValue placeholder="Anytime" /></SelectTrigger>
                        <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 ml-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                     </div>
                     <Select value={windowEnd || ''} onValueChange={setWindowEnd}>
                        <SelectTrigger id="windowEnd" className="h-12 rounded-xl"><SelectValue placeholder="Anytime" /></SelectTrigger>
                        <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Finalize */}
          {step === 4 && selectedTemplate && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <IconComponent className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Create "{habitName}"?</h2>
              <p className="text-muted-foreground">Here's a summary of your new habit:</p>
              <div className="p-4 bg-muted/50 rounded-2xl border border-primary/10 space-y-3 text-left">
                <p className="text-sm"><span className="font-bold">Name:</span> {habitName}</p>
                <p className="text-sm"><span className="font-bold">Goal:</span> {dailyGoal} {unit} per session</p>
                <p className="text-sm"><span className="font-bold">Frequency:</span> {frequency} times per week</p>
                <p className="text-sm"><span className="font-bold">Mode:</span> {isFixed ? 'Fixed' : (isTrialMode ? 'Trial' : 'Adaptive Growth')}</p>
                <p className="text-sm"><span className="font-bold">Category:</span> {habitCategories.find(c => c.value === category)?.label || category}</p>
                <p className="text-sm"><span className="font-bold">Chunking:</span> {autoChunking ? 'Automatic' : 'Manual'}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 gap-4">
            <Button variant="ghost" onClick={handleGuidedBack} disabled={createHabitMutation.isPending || step === 1} className="rounded-2xl px-8">Back</Button>
            <Button onClick={handleGuidedNext} disabled={createHabitMutation.isPending || (step === 1 && !selectedCategoryGroup) || (step === 2 && !selectedTemplateId)} className="flex-1 rounded-2xl h-12 text-base font-bold">
              {step === totalGuidedSteps ? 'Create Habit' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTemplateCreationForm = () => {
    const IconComponent = getHabitIconComponent(selectedIconName);

    return (
      <form onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto">
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
                value={habitName}
                onChange={(e) => {
                  setHabitName(e.target.value);
                }}
                placeholder="e.g., Daily Reading, Morning Run"
                className="h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="habitKey">Unique Template ID</Label>
              <Input
                id="habitKey"
                value={habitKey}
                onChange={(e) => setHabitKey(e.target.value)}
                placeholder="e.g., morning_meditation_template"
                className="h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A brief description for the template list."
                className="min-h-[80px] rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
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
              <div className="space-y-3">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={(value: 'min' | 'reps' | 'dose') => setUnit(value)}>
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
              <Label htmlFor="dailyGoal">Daily Goal ({unit})</Label>
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
            <div className="space-y-3">
              <Label htmlFor="frequency">Weekly Frequency</Label>
              <Slider
                id="frequency"
                min={1}
                max={7}
                step={1}
                value={[frequency]}
                onValueChange={(val) => setFrequency(val[0])}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1x</span>
                <span>{frequency} times per week</span>
                <span>7x</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <div className="flex items-center gap-2 ml-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <Label className="text-[10px] font-black uppercase opacity-60">Window Start</Label>
                 </div>
                 <Select value={windowStart || ''} onValueChange={setWindowStart}>
                    <SelectTrigger id="windowStart" className="h-12 rounded-xl"><SelectValue placeholder="Anytime" /></SelectTrigger>
                    <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                 <div className="flex items-center gap-2 ml-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                 </div>
                 <Select value={windowEnd || ''} onValueChange={setWindowEnd}>
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
              <Switch checked={isAnchorPractice} onCheckedChange={setIsAnchorPractice} />
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
              <Switch checked={autoChunking} onCheckedChange={setAutoChunking} />
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
              <div className="space-y-3">
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
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-14 rounded-2xl text-lg font-bold"
          disabled={createHabitMutation.isPending || createTemplateMutation.isPending}
        >
          {createHabitMutation.isPending || createTemplateMutation.isPending ? (
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
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title={isTemplateCreationMode ? "Contribute New Template" : "Habit Wizard"} /> {/* Updated title */}

      {/* Guided Flow (always rendered now) */}
      {renderGuidedStep()}

      {/* Template Creation Form (only if in template creation mode) */}
      {(isTemplateCreationMode || templateToPreFill) && renderTemplateCreationForm()}

      {/* New Habit Modal (removed from this file) */}
      {/* <NewHabitModal 
        isOpen={showNewHabitModal} 
        onClose={() => setShowNewHabitModal(false)} 
      /> */}
    </div>
  );
};

export default HabitWizard;