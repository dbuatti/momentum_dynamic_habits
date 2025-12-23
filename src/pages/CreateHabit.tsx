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
  Calendar, Timer, ChevronRight, ChevronLeft
} from 'lucide-react';
import { habitTemplates, habitCategories, habitUnits, habitModes, habitIcons, HabitTemplate } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { UserHabitRecord, HabitCategory as HabitCategoryType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ... (CreateHabitParams and createNewHabit function remain identical to your logic)
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
    carryover_value: 0,
  };

  const { error } = await supabase.from('user_habits').insert(habitToInsert);
  if (error) throw error;
  return { success: true };
};

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

const getHabitIcon = (iconName: string) => {
  return habitIcons.find(i => i.value === iconName)?.icon || Target;
};

const CreateHabit = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const [flowType, setFlowType] = useState<'entry' | 'guided' | 'custom'>('entry');
  const [step, setStep] = useState(1);

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
  const [notes, setNotes] = useState('');

  const otherHabits = useMemo(() => {
    return (journeyData?.allHabits || []).filter(h => h.id !== habitKey);
  }, [journeyData?.allHabits, habitKey]);

  const selectedTemplate = useMemo(() => {
    if (selectedTemplateId === 'custom_habit') {
      return {
        id: 'custom_habit', name: 'Custom Habit', category: 'daily',
        defaultFrequency: 3, defaultDuration: 15, defaultMode: 'Trial',
        defaultChunks: 1, autoChunking: true, anchorPractice: false,
        unit: 'min', xpPerUnit: 30, energyCostPerUnit: 6, icon: Target, plateauDaysRequired: 7,
      } as HabitTemplate;
    }
    return habitTemplates.find(t => t.id === selectedTemplateId);
  }, [selectedTemplateId]);

  useEffect(() => {
    if (selectedTemplate) {
      setHabitName(selectedTemplate.name);
      setHabitKey(selectedTemplate.id === 'custom_habit' ? '' : selectedTemplate.id);
      setCategory(selectedTemplate.category);
      setDailyGoal(selectedTemplate.defaultDuration);
      setFrequency(selectedTemplate.defaultFrequency);
      setIsTrialMode(selectedTemplate.defaultMode === 'Trial');
      setIsFixed(selectedTemplate.defaultMode === 'Fixed');
      setIsAnchorPractice(selectedTemplate.anchorPractice);
      setAutoChunking(selectedTemplate.autoChunking);
      setUnit(selectedTemplate.unit);
      setXpPerUnit(selectedTemplate.xpPerUnit);
      setEnergyCostPerUnit(selectedTemplate.energyCostPerUnit);
      const iconEntry = habitIcons.find(entry => entry.icon === selectedTemplate.icon);
      setSelectedIconName(iconEntry?.value || 'Target');
      setPlateauDaysRequired(selectedTemplate.plateauDaysRequired);
    }
  }, [selectedTemplate]);

  const createHabitMutation = useMutation({
    mutationFn: (habit: CreateHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createNewHabit({ userId: session.user.id, habit, neurodivergentMode });
    },
    onSuccess: () => {
      showSuccess('Habit created successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['journeyData'] });
      navigate('/');
    },
    onError: (error: any) => showError(`Failed to create habit: ${error.message}`),
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!habitName.trim() || dailyGoal <= 0) {
      showError('Please provide a habit name and goal.');
      return;
    }
    createHabitMutation.mutate({
      name: habitName,
      habit_key: habitKey || habitName.toLowerCase().replace(/\s/g, '_'),
      category, current_daily_goal: dailyGoal, frequency_per_week: frequency,
      is_trial_mode: isTrialMode, is_fixed: isFixed, anchor_practice: isAnchorPractice,
      auto_chunking: autoChunking, unit, xp_per_unit: xpPerUnit,
      energy_cost_per_unit: energyCostPerUnit, icon_name: selectedIconName,
      dependent_on_habit_id: dependentOnHabitId, plateau_days_required: plateauDaysRequired,
      window_start: windowStart, window_end: windowEnd,
    });
  };

  const renderGuidedStep = () => {
    const IconComponent = getHabitIcon(selectedIconName);
    const progress = (step / 9) * 100;

    return (
      <div className="space-y-6">
        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Step {step}/9</h3>
            <span className="text-[10px] font-bold opacity-60 uppercase">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        <Card className="rounded-[2rem] border-0 shadow-xl shadow-black/5 overflow-hidden">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">What's the vibe?</h2>
                  <p className="text-sm text-muted-foreground">Pick a template to start fast, or go custom.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {habitTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setStep(2);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3",
                        selectedTemplateId === template.id 
                          ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                          : "border-muted bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <template.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-tight">{template.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedTemplateId('custom_habit');
                      setStep(2);
                    }}
                    className="p-4 rounded-2xl border-2 border-dashed border-muted hover:border-primary/40 transition-all flex flex-col items-center text-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight">Custom</span>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">Identify your habit</h2>
                  <p className="text-sm text-muted-foreground">Give it a name. This is what you'll see on your dashboard.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Habit Name</Label>
                    <Input 
                      value={habitName} 
                      onChange={(e) => setHabitName(e.target.value)}
                      placeholder="e.g., Deep Work"
                      className="h-12 rounded-2xl border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Choose Icon</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {habitIcons.slice(0, 10).map((icon) => (
                        <button
                          key={icon.value}
                          onClick={() => setSelectedIconName(icon.value)}
                          className={cn(
                            "w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all",
                            selectedIconName === icon.value ? "border-primary bg-primary text-primary-foreground" : "border-muted hover:bg-muted"
                          )}
                        >
                          <icon.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black tracking-tight">How important is this?</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">Prioritizing helps manage cognitive load.</p>
                </div>
                <div className="grid gap-3">
                  {[
                    { val: true, label: 'Anchor Practice', sub: 'Non-negotiable. Top of dash.', icon: Anchor },
                    { val: false, label: 'Standard Habit', sub: 'Secondary. Builds momentum.', icon: Zap }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setIsAnchorPractice(opt.val)}
                      className={cn(
                        "p-4 rounded-3xl border-2 flex items-center gap-4 text-left transition-all",
                        isAnchorPractice === opt.val ? "border-primary bg-primary/5" : "border-muted"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isAnchorPractice === opt.val ? "bg-primary text-white" : "bg-muted")}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">{opt.label}</p>
                        <p className="text-[10px] opacity-60 leading-tight">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black tracking-tight">Weekly Frequency</h2>
                  <p className="text-sm text-muted-foreground">Don't overcommit. Aim for consistency first.</p>
                </div>
                <div className="space-y-10 py-4">
                  <Slider 
                    value={[frequency]} 
                    min={1} max={7} step={1} 
                    onValueChange={(v) => setFrequency(v[0])} 
                  />
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-60 px-2">
                    <span>Low Load (1x)</span>
                    <span className="text-xl text-primary">{frequency}x / Week</span>
                    <span>High Load (7x)</span>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black tracking-tight">Session Goal</h2>
                  <p className="text-sm text-muted-foreground">How much {unit} per session?</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 15, 30, 45, 60, 90].map(val => (
                    <Button 
                      key={val} 
                      variant={dailyGoal === val ? "default" : "outline"}
                      onClick={() => setDailyGoal(val)}
                      className="rounded-2xl h-14 font-black"
                    >
                      {val} {unit}
                    </Button>
                  ))}
                </div>
                <div className="pt-4">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Custom Amount</Label>
                  <Input 
                    type="number" 
                    value={dailyGoal} 
                    onChange={e => setDailyGoal(Number(e.target.value))} 
                    className="h-12 rounded-2xl" 
                  />
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black tracking-tight">Select Logic Mode</h2>
                  <p className="text-sm text-muted-foreground">How should the app handle your progress?</p>
                </div>
                <div className="grid gap-3">
                  {habitModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => {
                        setIsTrialMode(mode.value === 'Trial');
                        setIsFixed(mode.value === 'Fixed');
                      }}
                      className={cn(
                        "p-4 rounded-3xl border-2 flex items-start gap-4 text-left transition-all",
                        (isTrialMode && mode.value === 'Trial') || (isFixed && mode.value === 'Fixed') || (!isTrialMode && !isFixed && mode.value === 'Growth')
                          ? "border-primary bg-primary/5" : "border-muted"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl shrink-0 mt-1", (isTrialMode && mode.value === 'Trial') || (isFixed && mode.value === 'Fixed') || (!isTrialMode && !isFixed && mode.value === 'Growth') ? "bg-primary text-white" : "bg-muted")}>
                        <mode.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-xs uppercase tracking-tight">{mode.label}</p>
                        <p className="text-[10px] opacity-60 leading-tight">{mode.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black tracking-tight">Reduce Overwhelm</h2>
                  <p className="text-sm text-muted-foreground">Break long sessions into tiny capsules.</p>
                </div>
                <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary">
                      <Layers className="w-6 h-6" />
                      <span className="font-black text-sm uppercase">Auto-Chunking</span>
                    </div>
                    <Switch checked={autoChunking} onCheckedChange={setAutoChunking} />
                  </div>
                  <p className="text-[10px] opacity-70 leading-relaxed font-medium italic">
                    "Chunks help the ADHD brain bypass the barrier of entry by making the task feel smaller."
                  </p>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black tracking-tight">Execution Window</h2>
                  <p className="text-sm text-muted-foreground">When is your energy highest for this?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black ml-1 uppercase">Start</Label>
                    <Select value={windowStart || ''} onValueChange={setWindowStart}>
                      <SelectTrigger className="rounded-2xl h-12"><SelectValue placeholder="Anytime" /></SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black ml-1 uppercase">End</Label>
                    <Select value={windowEnd || ''} onValueChange={setWindowEnd}>
                      <SelectTrigger className="rounded-2xl h-12"><SelectValue placeholder="Anytime" /></SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                    <IconComponent className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight uppercase italic">{habitName || "Unnamed Habit"}</h2>
                    <p className="text-xs font-bold text-primary tracking-widest uppercase">Configuration Ready</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-3xl border border-black/5">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase opacity-40">Frequency</p>
                    <p className="text-xs font-black">{frequency}x Weekly</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase opacity-40">Goal</p>
                    <p className="text-xs font-black">{dailyGoal} {unit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-10">
              {step > 1 && (
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(step - 1)} 
                  className="rounded-2xl h-14 w-14 shrink-0"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}
              <Button 
                onClick={step === 9 ? () => handleSubmit() : () => setStep(step + 1)}
                className="flex-grow rounded-2xl h-14 text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                disabled={createHabitMutation.isPending}
              >
                {createHabitMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    {step === 9 ? 'Initialize Habit' : 'Keep Going'}
                    {step < 9 && <ChevronRight className="w-5 h-5 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCustomForm = () => {
    const IconComponent = getHabitIcon(selectedIconName);
    return (
      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
        {/* Core Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-1">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Identity</h3>
          </div>
          <Card className="rounded-[2.5rem] border-0 shadow-xl shadow-black/5">
            <CardContent className="p-8 grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Display Name</Label>
                  <Input value={habitName} onChange={e => setHabitName(e.target.value)} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Internal Key</Label>
                  <Input value={habitKey} onChange={e => setHabitKey(e.target.value)} className="h-12 rounded-2xl bg-muted/50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Habit Icon</Label>
                  <Select value={selectedIconName} onValueChange={setSelectedIconName}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {habitIcons.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Preview</Label>
                  <div className="h-12 w-full bg-muted rounded-2xl flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Parameters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-1">
            <Timer className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Dynamics</h3>
          </div>
          <Card className="rounded-[2.5rem] border-0 shadow-xl shadow-black/5">
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase">Frequency (Weekly)</Label>
                  <Slider value={[frequency]} min={1} max={7} onValueChange={v => setFrequency(v[0])} />
                  <p className="text-xl font-black text-indigo-500">{frequency}x</p>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase">Goal ({unit})</Label>
                  <Input type="number" value={dailyGoal} onChange={e => setDailyGoal(Number(e.target.value))} className="h-12 rounded-2xl font-black text-lg" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-between">
                  <span className="text-xs font-black uppercase">Anchor</span>
                  <Switch checked={isAnchorPractice} onCheckedChange={setIsAnchorPractice} />
                </div>
                <div className="p-4 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-center justify-between">
                  <span className="text-xs font-black uppercase">Chunking</span>
                  <Switch checked={autoChunking} onCheckedChange={setAutoChunking} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          type="submit" 
          disabled={createHabitMutation.isPending}
          className="w-full h-16 rounded-[2rem] text-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
        >
          {createHabitMutation.isPending ? <Loader2 className="animate-spin" /> : "Finalize Habit"}
        </Button>
      </form>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 pb-32 space-y-10 min-h-screen flex flex-col">
      <PageHeader title="New Practice" backLink="/" />

      {flowType === 'entry' && (
        <div className="flex-grow flex flex-col justify-center items-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary font-black text-[10px] uppercase tracking-tighter">
              <Sparkles className="w-3 h-3" /> Growth Engine v1.0
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              How do we <br /><span className="text-primary">start today?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <button
              onClick={() => setFlowType('guided')}
              className="group p-8 rounded-[3rem] bg-slate-900 text-white flex flex-col items-center text-center gap-6 shadow-2xl transition-all hover:translate-y-[-8px]"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic">Wizard</h3>
                <p className="text-xs opacity-60 font-medium">Guided path for ND brains.</p>
              </div>
            </button>

            <button
              onClick={() => setFlowType('custom')}
              className="group p-8 rounded-[3rem] bg-white border-2 border-slate-100 flex flex-col items-center text-center gap-6 transition-all hover:translate-y-[-8px] hover:border-primary/40"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1 text-slate-900">
                <h3 className="text-2xl font-black uppercase italic">Custom</h3>
                <p className="text-xs opacity-60 font-medium">Deep tweak every variable.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {flowType === 'guided' && renderGuidedStep()}
      {flowType === 'custom' && renderCustomForm()}
    </div>
  );
};

export default CreateHabit;