"use client";

import React, { useState, useMemo } from 'react';
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
  Plus, Loader2, Check, Info, Eye, EyeOff
} from 'lucide-react';
import { habitTemplates, habitCategories, habitUnits, habitModes, habitIcons, HabitTemplate } from '@/lib/habit-templates';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { UserHabitRecord, HabitCategory as HabitCategoryType } from '@/types/habit'; // Import HabitCategoryType
import { useJourneyData } from '@/hooks/useJourneyData'; // Import useJourneyData

interface CreateHabitParams {
  name: string;
  habit_key: string;
  category: HabitCategoryType; // Use HabitCategoryType
  current_daily_goal: number;
  frequency_per_week: number;
  is_trial_mode: boolean;
  is_fixed: boolean;
  anchor_practice: boolean;
  auto_chunking: boolean;
  unit: string;
  xp_per_unit: number;
  energy_cost_per_unit: number;
  icon_name: string; // New field for icon
  default_chunks: number; // Added default_chunks
  dependent_on_habit_id: string | null; // Added this line
}

const createNewHabit = async ({ userId, habit }: { userId: string; habit: CreateHabitParams }) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  const { name, habit_key, category, current_daily_goal, frequency_per_week, is_trial_mode, is_fixed, anchor_practice, auto_chunking, unit, xp_per_unit, energy_cost_per_unit, icon_name, default_chunks, dependent_on_habit_id } = habit; // Destructure default_chunks and dependent_on_habit_id

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
    plateau_days_required: is_trial_mode ? (category === 'cognitive' || category === 'wellness' ? 14 : 7) : 7, // Longer plateau for ND mode or specific categories
    completions_in_plateau: 0,
    is_fixed: is_fixed,
    category: anchor_practice ? 'anchor' : category, // Override category if anchor practice
    is_trial_mode: is_trial_mode,
    frequency_per_week: frequency_per_week,
    growth_phase: 'duration',
    window_start: null,
    window_end: null,
    days_of_week: [0, 1, 2, 3, 4, 5, 6], // Default to all days
    auto_chunking: auto_chunking,
    enable_chunks: auto_chunking, // Enable chunks if auto-chunking is on
    num_chunks: auto_chunking ? default_chunks : 1, // Use default_chunks from params
    chunk_duration: auto_chunking ? (current_daily_goal / default_chunks) : current_daily_goal, // Calculate chunk duration
    is_visible: true,
    dependent_on_habit_id: dependent_on_habit_id, // Added this line
  };

  const { error } = await supabase.from('user_habits').insert(habitToInsert);

  if (error) throw error;
  return { success: true };
};

const CreateHabit = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitKey, setHabitKey] = useState('');
  const [category, setCategory] = useState<HabitCategoryType>('daily'); // Use HabitCategoryType
  const [dailyGoal, setDailyGoal] = useState(15); // in minutes or reps
  const [frequency, setFrequency] = useState(3); // per week
  const [isTrialMode, setIsTrialMode] = useState(true);
  const [isFixed, setIsFixed] = useState(false);
  const [isAnchorPractice, setIsAnchorPractice] = useState(false);
  const [autoChunking, setAutoChunking] = useState(true);
  const [unit, setUnit] = useState<string>('min');
  const [xpPerUnit, setXpPerUnit] = useState(30);
  const [energyCostPerUnit, setEnergyCostPerUnit] = useState(6);
  const [selectedIconName, setSelectedIconName] = useState<string>('Target');
  const [dependentOnHabitId, setDependentOnHabitId] = useState<string | null>(null); // New state for dependency

  const { data: journeyData } = useJourneyData(); // Fetch all habits for dependency selection
  const otherHabits = useMemo(() => {
    return (journeyData?.habits || []).filter(h => h.is_visible); // All visible habits can be dependencies
  }, [journeyData?.habits]);

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
        icon: Target,
        plateauDaysRequired: 7, // Added this line
      } as HabitTemplate;
    }
    return habitTemplates.find(t => t.id === selectedTemplateId);
  }, [selectedTemplateId]);

  // Initialize form fields when a template is selected
  React.useEffect(() => {
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
      // Correctly assign icon name by finding the value from habitIcons
      const iconEntry = habitIcons.find(entry => entry.icon === selectedTemplate.icon);
      setSelectedIconName(iconEntry?.value || 'Target');
      setDependentOnHabitId(null); // Reset dependency when template changes
    }
  }, [selectedTemplate]);

  const createHabitMutation = useMutation({
    mutationFn: (habit: CreateHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createNewHabit({ userId: session.user.id, habit });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!habitName.trim() || !habitKey.trim() || dailyGoal <= 0 || frequency <= 0 || xpPerUnit <= 0 || energyCostPerUnit < 0) {
      showError('Please fill in all required fields with valid values.');
      return;
    }

    if (!selectedTemplate) {
      showError('Please select a habit template.');
      return;
    }

    createHabitMutation.mutate({
      name: habitName,
      habit_key: habitKey.toLowerCase().replace(/\s/g, '_'), // Ensure habit_key is lowercase and snake_case
      category: isAnchorPractice ? 'anchor' : category,
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
      default_chunks: selectedTemplate.defaultChunks, // Pass default_chunks from selectedTemplate
      dependent_on_habit_id: dependentOnHabitId, // Pass the selected dependency ID
    });
  };

  const IconComponent = habitIcons.find(i => i.value === selectedIconName)?.icon || Target;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title="Create New Habit" backLink="/" />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Template Selection */}
        <Card className="rounded-3xl shadow-sm border-0">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <Layers className="w-5 h-5 text-primary" />
              Choose a Template
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-2 gap-3">
              {habitTemplates.map((template) => {
                const TemplateIcon = template.icon;
                const isSelected = selectedTemplateId === template.id;
                return (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-auto p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 transition-all",
                      isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <TemplateIcon className="w-6 h-6 text-primary" />
                    <span className="text-sm font-semibold">{template.name}</span>
                    <span className="text-xs text-muted-foreground">{template.defaultDuration} {template.unit} • {template.defaultFrequency}x/week</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Habit Details */}
        <Card className="rounded-3xl shadow-sm border-0">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <Target className="w-5 h-5 text-primary" />
              Habit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="habitName">Habit Name</Label>
              <Input
                id="habitName"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="e.g., Daily Reading, Morning Run"
                className="h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="habitKey">Unique Habit Key (for internal use)</Label>
              <Input
                id="habitKey"
                value={habitKey}
                onChange={(e) => setHabitKey(e.target.value)}
                placeholder="e.g., daily_reading, morning_run"
                className="h-12 rounded-xl"
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
                <Select value={unit} onValueChange={setUnit}>
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
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Goal & Frequency */}
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
          </CardContent>
        </Card>

        {/* Growth Logic */}
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
                      "flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all",
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

            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Dependent On</Label>
                <Select 
                  value={dependentOnHabitId || 'none'} 
                  onValueChange={(value) => setDependentOnHabitId(value === 'none' ? null : value)}
                >
                  <SelectTrigger className="h-11 rounded-xl font-bold text-base">
                    <SelectValue placeholder="No dependency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No dependency</SelectItem>
                    {otherHabits.map(otherHabit => (
                      <SelectItem key={otherHabit.id} value={otherHabit.id}>
                        {otherHabit.name}
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

        {/* Advanced Settings (XP & Energy) */}
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
          disabled={createHabitMutation.isPending}
        >
          {createHabitMutation.isPending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Plus className="w-6 h-6 mr-2" />
              Create Habit
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default CreateHabit;