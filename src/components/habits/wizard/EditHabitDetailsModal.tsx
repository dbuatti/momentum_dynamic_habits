"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Plus, Loader2, Info, X, LayoutTemplate, Zap // Added Zap here
} from 'lucide-react';
import { habitCategories, habitUnits, habitModes, habitIcons, HabitTemplate } from '@/lib/habit-templates';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { UserHabitRecord, HabitCategory as HabitCategoryType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { CreateHabitParams } from '@/pages/HabitWizard'; // Re-using this interface for consistency
import { habitIconMap } from '@/lib/habit-utils';

interface EditHabitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHabitData: Partial<CreateHabitParams>; // Data to pre-fill the form
  onSave: (updatedData: Partial<CreateHabitParams>) => void;
  isSaving: boolean;
  isTemplateMode?: boolean;
}

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

const getHabitIconComponent = (iconName: string) => {
  return habitIcons.find(i => i.value === iconName)?.icon || Target;
};

export const EditHabitDetailsModal: React.FC<EditHabitDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  initialHabitData, 
  onSave, 
  isSaving,
  isTemplateMode = false
}) => {
  const { data: journeyData } = useJourneyData();
  
  // Form state, initialized from initialHabitData
  const [habitName, setHabitName] = useState(initialHabitData.name || '');
  const [habitKey, setHabitKey] = useState(initialHabitData.habit_key || '');
  const [category, setCategory] = useState<HabitCategoryType>(initialHabitData.category || 'daily');
  const [dailyGoal, setDailyGoal] = useState(initialHabitData.current_daily_goal || 15);
  const [frequency, setFrequency] = useState(initialHabitData.frequency_per_week || 3);
  const [isTrialMode, setIsTrialMode] = useState(initialHabitData.is_trial_mode || false);
  const [isFixed, setIsFixed] = useState(initialHabitData.is_fixed || false);
  const [isAnchorPractice, setIsAnchorPractice] = useState(initialHabitData.anchor_practice || false);
  const [autoChunking, setAutoChunking] = useState(initialHabitData.auto_chunking || false);
  const [unit, setUnit] = useState<'min' | 'reps' | 'dose'>(initialHabitData.unit || 'min');
  const [xpPerUnit, setXpPerUnit] = useState(initialHabitData.xp_per_unit || 30);
  const [energyCostPerUnit, setEnergyCostPerUnit] = useState(initialHabitData.energy_cost_per_unit || 6);
  const [selectedIconName, setSelectedIconName] = useState<string>(initialHabitData.icon_name || 'Target');
  const [dependentOnHabitId, setDependentOnHabitId] = useState<string | null>(initialHabitData.dependent_on_habit_id || null);
  const [plateauDaysRequired, setPlateauDaysRequired] = useState(initialHabitData.plateau_days_required || 7);
  const [windowStart, setWindowStart] = useState<string | null>(initialHabitData.window_start || null);
  const [windowEnd, setWindowEnd] = useState<string | null>(initialHabitData.window_end || null);
  const [carryoverEnabled, setCarryoverEnabled] = useState(initialHabitData.carryover_enabled || false);
  const [shortDescription, setShortDescription] = useState(initialHabitData.short_description || '');

  // Update form state when initialHabitData changes (e.g., when modal opens with new data)
  useEffect(() => {
    setHabitName(initialHabitData.name || '');
    setHabitKey(initialHabitData.habit_key || '');
    setCategory(initialHabitData.category || 'daily');
    setDailyGoal(initialHabitData.current_daily_goal || 15);
    setFrequency(initialHabitData.frequency_per_week || 3);
    setIsTrialMode(initialHabitData.is_trial_mode || false);
    setIsFixed(initialHabitData.is_fixed || false);
    setIsAnchorPractice(initialHabitData.anchor_practice || false);
    setAutoChunking(initialHabitData.auto_chunking || false);
    setUnit(initialHabitData.unit || 'min');
    setXpPerUnit(initialHabitData.xp_per_unit || 30);
    setEnergyCostPerUnit(initialHabitData.energy_cost_per_unit || 6);
    setSelectedIconName(initialHabitData.icon_name || 'Target');
    setDependentOnHabitId(initialHabitData.dependent_on_habit_id || null);
    setPlateauDaysRequired(initialHabitData.plateau_days_required || 7);
    setWindowStart(initialHabitData.window_start || null);
    setWindowEnd(initialHabitData.window_end || null);
    setCarryoverEnabled(initialHabitData.carryover_enabled || false);
    setShortDescription(initialHabitData.short_description || '');
  }, [initialHabitData]);

  // Calculate estimated weekly total
  const estimatedWeeklyTotal = useMemo(() => dailyGoal * frequency, [dailyGoal, frequency]);

  // Get other habits for dependency dropdown
  const otherHabits = useMemo(() => {
    return (journeyData?.allHabits || []).filter(h => h.habit_key !== habitKey);
  }, [journeyData?.allHabits, habitKey]);

  const selectedDependentHabit = useMemo(() => {
    if (!dependentOnHabitId) return null;
    return otherHabits.find(h => h.id === dependentOnHabitId);
  }, [dependentOnHabitId, otherHabits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!habitName.trim() || !habitKey.trim() || dailyGoal <= 0 || frequency <= 0 || xpPerUnit <= 0 || energyCostPerUnit < 0) {
      showError('Please fill in all required fields with valid values.');
      return;
    }
    if (isTemplateMode && !shortDescription.trim()) {
      showError('Please provide a short description for your template.');
      return;
    }

    const updatedData: Partial<CreateHabitParams> = {
      name: habitName,
      habit_key: habitKey.toLowerCase().replace(/\s/g, '_'),
      category: category,
      current_daily_goal: Math.round(dailyGoal), // Round here
      frequency_per_week: Math.round(frequency), // Round here
      is_trial_mode: isTrialMode,
      is_fixed: isFixed,
      anchor_practice: isAnchorPractice,
      auto_chunking: autoChunking,
      unit: unit,
      xp_per_unit: Math.round(xpPerUnit), // Round here
      energy_cost_per_unit: energyCostPerUnit,
      icon_name: selectedIconName,
      dependent_on_habit_id: dependentOnHabitId,
      plateau_days_required: Math.round(plateauDaysRequired), // Round here
      window_start: windowStart,
      window_end: windowEnd,
      carryover_enabled: carryoverEnabled,
      short_description: shortDescription,
    };

    onSave(updatedData);
  };

  const IconComponent = getHabitIconComponent(selectedIconName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="sticky top-0 bg-background/95 backdrop-blur-sm p-6 border-b z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {isTemplateMode ? <LayoutTemplate className="w-6 h-6" /> : <Target className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{isTemplateMode ? 'Edit Template Details' : 'Edit Habit Details'}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Refine your habit parameters directly
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Habit Details Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {isTemplateMode ? 'Template Info' : 'Habit Details'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="habitName">{isTemplateMode ? 'Template Name' : 'Habit Name'} *</Label>
                <Input
                  id="habitName"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g., Daily Reading"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="habitKey">{isTemplateMode ? 'Unique Template ID' : 'Unique Key'} *</Label>
                <Input
                  id="habitKey"
                  value={habitKey}
                  onChange={(e) => setHabitKey(e.target.value)}
                  placeholder="e.g., daily_reading"
                  className="h-12 rounded-xl"
                  required
                />
                <p className="text-xs text-muted-foreground">Auto-generated from name, but editable</p>
              </div>
            </div>

            {isTemplateMode && (
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={(value: 'min' | 'reps' | 'dose') => {
                  setUnit(value);
                  // If changing to 'dose' and current dailyGoal is not 1, suggest 1
                  if (value === 'dose' && dailyGoal !== 1) {
                    setDailyGoal(1);
                  }
                }}>
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

              <div className="space-y-2">
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
            </div>
          </div>

          {/* Goals & Schedule Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Goals & Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Goal ({unit}) *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="frequency">Weekly Frequency *</Label>
                <Slider
                  id="frequency"
                  min={1}
                  max={7}
                  step={1}
                  value={[frequency]}
                  onValueChange={(val) => setFrequency(val[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1x</span>
                  <span className="font-bold text-foreground">{frequency} times per week</span>
                  <span>7x</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-sm font-semibold text-primary mb-2">Estimated Weekly Total</p>
              <p className="text-2xl font-bold">{estimatedWeeklyTotal} {unit}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {dailyGoal} {unit} × {frequency} sessions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black uppercase opacity-60">Window Start</Label>
                </div>
                <Select value={windowStart || ''} onValueChange={setWindowStart}>
                  <SelectTrigger id="windowStart" className="h-12 rounded-xl">
                    <SelectValue placeholder="Anytime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Anytime</SelectItem>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black uppercase opacity-60">Window End</Label>
                </div>
                <Select value={windowEnd || ''} onValueChange={setWindowEnd}>
                  <SelectTrigger id="windowEnd" className="h-12 rounded-xl">
                    <SelectValue placeholder="Anytime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Anytime</SelectItem>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Growth Logic Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Growth Logic
            </h3>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex gap-3">
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <Anchor className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Anchor Practice</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Prioritize this habit on your dashboard.</p>
                  </div>
                </div>
                <Switch 
                  checked={isAnchorPractice} 
                  onCheckedChange={setIsAnchorPractice} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-info-background/50 border border-info-border/50">
                <div className="flex gap-3">
                  <div className="bg-info-background/50 p-2 rounded-xl">
                    <Layers className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Adaptive Auto-Chunking</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Automagically break sessions into capsules.</p>
                  </div>
                </div>
                <Switch 
                  checked={autoChunking} 
                  onCheckedChange={setAutoChunking} 
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
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

            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="flex gap-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase">Carryover Enabled</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Unused progress rolls over to next day.</p>
                </div>
              </div>
              <Switch 
                checked={carryoverEnabled} 
                onCheckedChange={setCarryoverEnabled} 
              />
            </div>
          </div>

          {/* Advanced Settings Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Advanced Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
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
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-semibold"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isTemplateMode ? <LayoutTemplate className="w-6 h-6 mr-2" /> : <Plus className="w-6 h-6 mr-2" />}
                  {isTemplateMode ? 'Contribute Template' : 'Create Habit'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};