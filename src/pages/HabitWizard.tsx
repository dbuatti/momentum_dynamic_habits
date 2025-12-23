"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useInitializeMissingHabits } from '@/hooks/useInitializeMissingHabits';
import { showError, showSuccess } from '@/utils/toast';
import { 
  Target, Anchor, Zap, ShieldCheck, Brain, Clock, Layers,
  Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  Info, X, Plus, Loader2, CheckCircle2, ArrowRight, ArrowLeft, 
  Activity, Heart, Flame, Focus, Calendar, Timer, Settings
} from 'lucide-react';
import { habitTemplates, habitCategories, habitUnits, habitModes, habitIcons, HabitTemplate } from '@/lib/habit-templates';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHabitRecord, HabitCategory as HabitCategoryType } from '@/types/habit';
import { calculateLevel } from '@/utils/leveling';

// --- Types ---
interface WizardState {
  focusArea: string;
  motivation: string;
  dailyGoal: number;
  weeklyFrequency: number;
  barriers: string[];
  timing: string;
  confidence: number;
  advanced: {
    xpPerUnit: number;
    energyCostPerUnit: number;
    icon: string;
    name: string;
    habitKey: string;
    unit: 'min' | 'reps' | 'dose';
    category: HabitCategoryType;
    shortDescription: string;
    isPublic: boolean;
  };
}

// --- Constants ---
const FOCUS_AREAS = [
  { value: 'cognitive', label: 'Learning & Focus', icon: BookOpen, desc: 'Study, reading, skill development' },
  { value: 'physical', label: 'Movement & Fitness', icon: Dumbbell, desc: 'Exercise, sports, mobility' },
  { value: 'wellness', label: 'Mindfulness & Health', icon: Wind, desc: 'Meditation, journaling, self-care' },
  { value: 'daily', label: 'Daily Tasks', icon: Home, desc: 'Chores, routines, maintenance' },
  { value: 'creative', label: 'Creative Practice', icon: Music, desc: 'Art, music, writing, design' },
];

const MOTIVATIONS = [
  { value: 'stress', label: 'Reduce Stress', icon: Heart, desc: 'I want to feel calmer and more in control' },
  { value: 'skills', label: 'Build Skills', icon: Focus, desc: 'I want to learn and grow' },
  { value: 'health', label: 'Improve Health', icon: Activity, desc: 'I want to feel better physically' },
  { value: 'routine', label: 'Create Routine', icon: Calendar, desc: 'I want structure and consistency' },
  { value: 'energy', label: 'Boost Energy', icon: Flame, desc: 'I want more vitality' },
];

const BARRIERS = [
  { value: 'time', label: 'No Time', icon: Clock },
  { value: 'energy', label: 'Low Energy', icon: Battery },
  { value: 'focus', label: 'Can\'t Focus', icon: Focus },
  { value: 'motivation', label: 'No Motivation', icon: Flame },
  { value: 'overwhelm', label: 'Too Big', icon: Layers },
];

const TIMING_OPTIONS = [
  { value: 'morning', label: 'Morning (5am-12pm)', icon: Sunrise },
  { value: 'afternoon', label: 'Afternoon (12pm-5pm)', icon: Sun },
  { value: 'evening', label: 'Evening (5pm-9pm)', icon: Moon },
  { value: 'night', label: 'Night (9pm-5am)', icon: Moon },
  { value: 'flexible', label: 'Flexible', icon: Clock },
];

const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Very Low', desc: 'I struggle to start' },
  { value: 2, label: 'Low', desc: 'I need reminders' },
  { value: 3, label: 'Medium', desc: 'I can do it sometimes' },
  { value: 4, label: 'High', desc: 'I am consistent' },
  { value: 5, label: 'Very High', desc: 'It is automatic' },
];

// --- Helper Components ---
const StepCard = ({ children, title, description, icon: Icon }: { children: React.ReactNode, title: string, description?: string, icon: React.ElementType }) => (
  <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-3xl overflow-hidden border-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
    <CardHeader className="bg-primary/5 p-6 pb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </CardHeader>
    <CardContent className="p-6 space-y-6">
      {children}
    </CardContent>
  </Card>
);

const OptionGrid = ({ options, selected, onSelect }: { options: any[], selected: string | null, onSelect: (value: string) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {options.map((opt) => {
      const isSelected = selected === opt.value;
      const Icon = opt.icon;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all",
            isSelected 
              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
              : "border-border hover:bg-muted/50"
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">{opt.label}</p>
            {opt.desc && <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>}
          </div>
        </button>
      );
    })}
  </div>
);

// --- Main Component ---
const HabitWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  // State
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  
  // Wizard State
  const [wizardState, setWizardState] = useState<WizardState>({
    focusArea: '',
    motivation: '',
    dailyGoal: 15,
    weeklyFrequency: 3,
    barriers: [],
    timing: 'flexible',
    confidence: 3,
    advanced: {
      xpPerUnit: 30,
      energyCostPerUnit: 6,
      icon: 'Target',
      name: '',
      habitKey: '',
      unit: 'min',
      category: 'daily',
      shortDescription: '',
      isPublic: false,
    },
  });

  // Check for template pre-fill or template mode
  useEffect(() => {
    const state = location.state as any;
    if (state?.mode === 'template') {
      setIsTemplateMode(true);
    }
    if (state?.templateToPreFill) {
      const t = state.templateToPreFill as HabitTemplate;
      setWizardState(prev => ({
        ...prev,
        focusArea: t.category,
        dailyGoal: t.defaultDuration,
        weeklyFrequency: t.defaultFrequency,
        advanced: {
          ...prev.advanced,
          name: t.name,
          habitKey: t.id,
          unit: t.unit,
          category: t.category as HabitCategoryType,
          icon: t.icon_name,
          xpPerUnit: t.xpPerUnit,
          energyCostPerUnit: t.energyCostPerUnit,
          shortDescription: t.shortDescription || '',
        },
      }));
      setStep(8); // Jump to preview
    }
  }, [location.state]);

  // Auto-generate fields based on focus area
  useEffect(() => {
    if (wizardState.focusArea) {
      const mapping: Record<string, { unit: 'min' | 'reps' | 'dose', category: HabitCategoryType, icon: string, xp: number, energy: number }> = {
        'cognitive': { unit: 'min', category: 'cognitive', icon: 'BookOpen', xp: 42, energy: 9 },
        'physical': { unit: 'min', category: 'physical', icon: 'Dumbbell', xp: 30, energy: 6 },
        'wellness': { unit: 'min', category: 'wellness', icon: 'Wind', xp: 30, energy: 6 },
        'daily': { unit: 'min', category: 'daily', icon: 'Home', xp: 24, energy: 4.8 },
        'creative': { unit: 'min', category: 'cognitive', icon: 'Music', xp: 36, energy: 7.2 },
      };
      const m = mapping[wizardState.focusArea];
      if (m) {
        setWizardState(prev => ({
          ...prev,
          advanced: { ...prev.advanced, unit: m.unit, category: m.category, icon: m.icon, xpPerUnit: m.xp, energyCostPerUnit: m.energy }
        }));
      }
    }
  }, [wizardState.focusArea]);

  // Auto-generate name and key from focus area and motivation
  useEffect(() => {
    if (wizardState.focusArea && wizardState.motivation) {
      const focusLabel = FOCUS_AREAS.find(f => f.value === wizardState.focusArea)?.label.split(' ')[0] || 'Habit';
      const motivationLabel = MOTIVATIONS.find(m => m.value === wizardState.motivation)?.label.split(' ')[0] || 'Practice';
      const name = `${focusLabel} ${motivationLabel}`;
      const key = name.toLowerCase().replace(/\s/g, '_');
      
      setWizardState(prev => ({
        ...prev,
        advanced: { ...prev.advanced, name, habitKey: key }
      }));
    }
  }, [wizardState.focusArea, wizardState.motivation]);

  // Calculate suggested values based on barriers and confidence
  const suggestedValues = useMemo(() => {
    const barriers = wizardState.barriers;
    const confidence = wizardState.confidence;
    
    // Logic for Trial vs Growth vs Fixed
    let suggestedMode: 'Trial' | 'Growth' | 'Fixed' = 'Growth';
    let suggestedPlateau = neurodivergentMode ? 10 : 5;
    
    if (confidence <= 2 || barriers.length > 0) {
      suggestedMode = 'Trial';
      suggestedPlateau = neurodivergentMode ? 14 : 7;
    } else if (confidence >= 4 && barriers.length === 0) {
      suggestedMode = 'Growth';
    }

    // Logic for Auto-Chunking
    const shouldChunk = barriers.includes('overwhelm') || confidence <= 2 || wizardState.dailyGoal > (neurodivergentMode ? 10 : 20);

    // Logic for Time Window
    let suggestedWindow = { start: '09:00', end: '17:00' };
    if (wizardState.timing === 'morning') suggestedWindow = { start: '05:00', end: '12:00' };
    if (wizardState.timing === 'afternoon') suggestedWindow = { start: '12:00', end: '17:00' };
    if (wizardState.timing === 'evening') suggestedWindow = { start: '17:00', end: '21:00' };
    if (wizardState.timing === 'night') suggestedWindow = { start: '21:00', end: '05:00' };
    if (wizardState.timing === 'flexible') suggestedWindow = { start: '', end: '' };

    return { suggestedMode, suggestedPlateau, shouldChunk, suggestedWindow };
  }, [wizardState.barriers, wizardState.confidence, wizardState.dailyGoal, wizardState.timing, neurodivergentMode]);

  // Handlers
  const updateState = (path: string, value: any) => {
    setWizardState(prev => {
      const newState = { ...prev };
      const keys = path.split('.');
      let current: any = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const toggleBarrier = (barrier: string) => {
    setWizardState(prev => ({
      ...prev,
      barriers: prev.barriers.includes(barrier) 
        ? prev.barriers.filter(b => b !== barrier)
        : [...prev.barriers, barrier]
    }));
  };

  const handleNext = () => {
    if (step < 8) setStep(step + 1);
    else handleFinish();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/create-habit'); // Go back to mode selection
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!session?.user?.id) throw new Error('Not authenticated');

      // Determine final mode based on suggestions (can be overridden in preview)
      const isFixed = false; // Wizard doesn't set fixed, user can override
      const isTrial = suggestedValues.suggestedMode === 'Trial';
      
      // Calculate chunking
      let numChunks = 1;
      let chunkDuration = wizardState.dailyGoal;
      if (suggestedValues.shouldChunk && wizardState.advanced.unit === 'min') {
        const target = neurodivergentMode ? 5 : 10;
        numChunks = Math.max(1, Math.ceil(wizardState.dailyGoal / target));
        chunkDuration = Number((wizardState.dailyGoal / numChunks).toFixed(1));
      }

      // Build habit object
      const habitToInsert: Partial<UserHabitRecord> = {
        user_id: session.user.id,
        habit_key: wizardState.advanced.habitKey,
        name: wizardState.advanced.name,
        unit: wizardState.advanced.unit,
        xp_per_unit: wizardState.advanced.xpPerUnit,
        energy_cost_per_unit: wizardState.advanced.energyCostPerUnit,
        current_daily_goal: wizardState.dailyGoal,
        long_term_goal: wizardState.dailyGoal * (wizardState.advanced.unit === 'min' ? 365 * 60 : 365),
        momentum_level: 'Building',
        lifetime_progress: 0,
        last_goal_increase_date: new Date().toISOString().split('T')[0],
        is_frozen: false,
        max_goal_cap: null,
        last_plateau_start_date: new Date().toISOString().split('T')[0],
        plateau_days_required: suggestedValues.suggestedPlateau,
        completions_in_plateau: 0,
        is_fixed: isFixed,
        category: wizardState.advanced.category,
        is_trial_mode: isTrial,
        frequency_per_week: wizardState.weeklyFrequency,
        growth_phase: 'duration',
        window_start: suggestedValues.suggestedWindow.start || null,
        window_end: suggestedValues.suggestedWindow.end || null,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        auto_chunking: suggestedValues.shouldChunk,
        enable_chunks: suggestedValues.shouldChunk,
        num_chunks: numChunks,
        chunk_duration: chunkDuration,
        is_visible: true,
        dependent_on_habit_id: null, // Can be set in manual override later
        anchor_practice: wizardState.motivation === 'routine', // Simple logic: routine = anchor
        carryover_value: 0,
      };

      // If template mode, also save to templates table
      if (isTemplateMode) {
        const { error: templateError } = await supabase.from('habit_templates').insert({
          id: wizardState.advanced.habitKey,
          name: wizardState.advanced.name,
          category: wizardState.advanced.category,
          default_frequency: wizardState.weeklyFrequency,
          default_duration: wizardState.dailyGoal,
          default_mode: isTrial ? 'Trial' : 'Growth',
          default_chunks: numChunks,
          auto_chunking: suggestedValues.shouldChunk,
          anchor_practice: wizardState.motivation === 'routine',
          unit: wizardState.advanced.unit,
          xp_per_unit: wizardState.advanced.xpPerUnit,
          energy_cost_per_unit: wizardState.advanced.energyCostPerUnit,
          icon_name: wizardState.advanced.icon,
          plateau_days_required: suggestedValues.suggestedPlateau,
          short_description: `Custom habit: ${wizardState.advanced.name}`,
          is_public: true,
          creator_id: session.user.id,
        });
        if (templateError) throw templateError;
      }

      // Save habit
      const { error } = await supabase.from('user_habits').upsert(habitToInsert, { onConflict: 'user_id, habit_key' });
      if (error) throw error;

      // Update profile XP/Level if this is a new habit creation (not template)
      if (!isTemplateMode) {
        const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', session.user.id).single();
        if (profile) {
          const newXp = (profile.xp || 0) + 10; // Bonus XP for creating a habit
          await supabase.from('profiles').update({ xp: newXp, level: calculateLevel(newXp) }).eq('id', session.user.id);
        }
      }

      showSuccess(isTemplateMode ? 'Template created successfully!' : 'Habit created successfully!');
      navigate(isTemplateMode ? '/templates' : '/');
    } catch (error: any) {
      showError(`Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepCard title="What do you want to work on?" description="Choose a focus area to get started." icon={Target}>
            <OptionGrid options={FOCUS_AREAS} selected={wizardState.focusArea} onSelect={(v) => updateState('focusArea', v)} />
          </StepCard>
        );
      case 2:
        return (
          <StepCard title="What's your motivation?" description="This helps tailor the habit to your needs." icon={Heart}>
            <OptionGrid options={MOTIVATIONS} selected={wizardState.motivation} onSelect={(v) => updateState('motivation', v)} />
          </StepCard>
        );
      case 3:
        return (
          <StepCard title="Set your capacity" description="Be realistic. You can always increase later." icon={Activity}>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Daily Goal ({wizardState.advanced.unit})</Label>
                <Input 
                  type="number" 
                  value={wizardState.dailyGoal} 
                  onChange={(e) => updateState('dailyGoal', Number(e.target.value))}
                  className="h-12 rounded-xl text-lg font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label>Weekly Frequency</Label>
                <Slider 
                  min={1} max={7} step={1} 
                  value={[wizardState.weeklyFrequency]} 
                  onValueChange={(v) => updateState('weeklyFrequency', v[0])}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1x/week</span>
                  <span className="font-bold text-foreground">{wizardState.weeklyFrequency}x/week</span>
                  <span>7x/week</span>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                <p className="text-2xl font-black text-primary">
                  {wizardState.dailyGoal * wizardState.weeklyFrequency} {wizardState.advanced.unit}/week
                </p>
                <p className="text-xs text-muted-foreground mt-1">Estimated weekly total</p>
              </div>
            </div>
          </StepCard>
        );
      case 4:
        return (
          <StepCard title="What are your barriers?" description="Select all that apply. This helps us adapt." icon={Layers}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BARRIERS.map((b) => {
                const isSelected = wizardState.barriers.includes(b.value);
                const Icon = b.icon;
                return (
                  <button
                    key={b.value}
                    onClick={() => toggleBarrier(b.value)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-bold text-sm">{b.label}</span>
                  </button>
                );
              })}
            </div>
          </StepCard>
        );
      case 5:
        return (
          <StepCard title="When do you feel best?" description="We'll suggest a time window." icon={Clock}>
            <OptionGrid options={TIMING_OPTIONS} selected={wizardState.timing} onSelect={(v) => updateState('timing', v)} />
          </StepCard>
        );
      case 6:
        return (
          <StepCard title="How confident are you?" description="This determines the growth strategy." icon={Zap}>
            <div className="space-y-3">
              <Slider 
                min={1} max={5} step={1} 
                value={[wizardState.confidence]} 
                onValueChange={(v) => updateState('confidence', v[0])}
                className="data-[orientation=horizontal]:h-2"
              />
              <div className="flex justify-between text-sm font-bold">
                {CONFIDENCE_LEVELS.map((l) => (
                  <div key={l.value} className={cn("flex flex-col items-center w-16", wizardState.confidence === l.value ? "text-primary" : "text-muted-foreground")}>
                    <span>{l.value}</span>
                    <span className="text-[10px] font-normal text-center">{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-muted/50 rounded-2xl border text-center">
                <p className="text-sm font-bold">
                  Suggested Mode: <span className="text-primary">{suggestedValues.suggestedMode}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {suggestedValues.suggestedMode === 'Trial' 
                    ? "Focus on consistency, no pressure to grow." 
                    : "Adaptive growth based on your momentum."}
                </p>
              </div>
            </div>
          </StepCard>
        );
      case 7:
        return (
          <StepCard title="Advanced Settings" description="Optional: Fine-tune your habit." icon={Settings}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>XP per {wizardState.advanced.unit}</Label>
                  <Input type="number" value={wizardState.advanced.xpPerUnit} onChange={(e) => updateState('advanced.xpPerUnit', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Energy Cost</Label>
                  <Input type="number" step="0.1" value={wizardState.advanced.energyCostPerUnit} onChange={(e) => updateState('advanced.energyCostPerUnit', Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={wizardState.advanced.icon} onValueChange={(v) => updateState('advanced.icon', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {habitIcons.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {isTemplateMode && (
                <>
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={wizardState.advanced.name} onChange={(e) => updateState('advanced.name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Template ID (Key)</Label>
                    <Input value={wizardState.advanced.habitKey} onChange={(e) => updateState('advanced.habitKey', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea value={wizardState.advanced.shortDescription} onChange={(e) => updateState('advanced.shortDescription', e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </StepCard>
        );
      case 8:
        return (
          <StepCard title="Preview & Confirm" description="Review your habit before creating." icon={CheckCircle2}>
            <div className="space-y-6">
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">{wizardState.advanced.name}</h3>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {React.createElement(habitIcons.find(i => i.value === wizardState.advanced.icon)?.icon || Target)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Category:</span> <span className="font-bold capitalize">{wizardState.advanced.category}</span></div>
                  <div><span className="text-muted-foreground">Unit:</span> <span className="font-bold">{wizardState.advanced.unit}</span></div>
                  <div><span className="text-muted-foreground">Daily Goal:</span> <span className="font-bold">{wizardState.dailyGoal}</span></div>
                  <div><span className="text-muted-foreground">Frequency:</span> <span className="font-bold">{wizardState.weeklyFrequency}x/week</span></div>
                  <div><span className="text-muted-foreground">Mode:</span> <span className="font-bold">{suggestedValues.suggestedMode}</span></div>
                  <div><span className="text-muted-foreground">Anchor:</span> <span className="font-bold">{wizardState.motivation === 'routine' ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-muted-foreground">Chunking:</span> <span className="font-bold">{suggestedValues.shouldChunk ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-muted-foreground">Time Window:</span> <span className="font-bold">{suggestedValues.suggestedWindow.start || 'Anytime'}</span></div>
                </div>
                <div className="pt-4 border-t border-primary/10">
                  <p className="text-sm text-muted-foreground italic">
                    {isTemplateMode 
                      ? "This will be saved as a public template for others to use." 
                      : "This habit will be added to your dashboard immediately."}
                  </p>
                </div>
              </div>
            </div>
          </StepCard>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = useMemo(() => {
    if (step === 1 && !wizardState.focusArea) return true;
    if (step === 2 && !wizardState.motivation) return true;
    if (step === 3 && (wizardState.dailyGoal <= 0 || wizardState.weeklyFrequency <= 0)) return true;
    return false;
  }, [step, wizardState]);

  const progress = (step / 8) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background pb-20">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
          <span>Step {step} of 8</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {renderStep()}

      {/* Navigation */}
      <div className="flex gap-4 mt-6 w-full max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          disabled={step === 1 || isSubmitting}
          className="flex-1 h-14 rounded-2xl font-semibold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={isNextDisabled || isSubmitting}
          className="flex-1 h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              {step === 8 ? (isTemplateMode ? 'Create Template' : 'Create Habit') : 'Next'}
              {step < 8 && <ArrowRight className="w-5 h-5 ml-2" />}
            </>
          )}
        </Button>
      </div>

      {/* Cancel Button */}
      <Button 
        variant="link" 
        onClick={() => navigate(isTemplateMode ? '/templates' : '/create-habit')}
        className="mt-4 text-muted-foreground"
      >
        Cancel Wizard
      </Button>
    </div>
  );
};

export default HabitWizard;