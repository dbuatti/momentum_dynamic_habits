"use client";

import React, { useMemo } from 'react';
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
  Target, Anchor, Brain, Clock, Layers,
  Plus, Loader2, Info, LayoutTemplate
} from 'lucide-react';
import { habitCategories, habitUnits, habitModes, habitIcons } from '@/lib/habit-templates';
import { useMutation } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { HabitCategory as HabitCategoryType } from '@/types/habit';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';
import { useJourneyData } from '@/hooks/useJourneyData';
import { CreateHabitParams } from '@/pages/HabitWizard'; // Import the type from HabitWizard

interface HabitTemplateFormProps {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  handleSubmitFinal: (e?: React.FormEvent) => Promise<void>;
  isSaving: boolean;
  createHabitMutation: ReturnType<typeof useMutation>; // Corrected type
  createTemplateMutation: ReturnType<typeof useCreateTemplate>; // Corrected type
}

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

const getHabitIconComponent = (iconName: string) => {
  return habitIcons.find(i => i.value === iconName)?.icon || Target;
};

export const HabitTemplateForm: React.FC<HabitTemplateFormProps> = ({
  wizardData,
  setWizardData,
  handleSubmitFinal,
  isSaving,
  createHabitMutation,
  createTemplateMutation,
}) => {
  const { data: journeyData } = useJourneyData();
  const IconComponent = getHabitIconComponent(wizardData.icon_name || 'Target');

  // Calculate estimated weekly total
  const estimatedWeeklyTotal = useMemo(() => (wizardData.daily_goal || 0) * (wizardData.frequency_per_week || 0), [wizardData.daily_goal, wizardData.frequency_per_week]);

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
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <p className="text-sm font-semibold text-primary mb-2">Estimated Weekly Total</p>
            <p className="text-2xl font-bold">{estimatedWeeklyTotal} {wizardData.unit}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {wizardData.daily_goal || 0} {wizardData.unit} × {wizardData.frequency_per_week || 0} sessions
            </p>
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
};