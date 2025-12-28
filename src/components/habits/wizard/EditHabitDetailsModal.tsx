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
  Plus, Loader2, Info, X, LayoutTemplate, Zap,
  Percent, Hash
} from 'lucide-react';
import { habitCategories, habitUnits, habitModes, habitIcons, habitMeasurementTypes, HabitTemplate } from '@/lib/habit-templates';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { UserHabitRecord, HabitCategory as HabitCategoryType, MeasurementType, GrowthType } from '@/types/habit';
import { useJourneyData } from '@/hooks/useJourneyData';
import { CreateHabitParams } from '@/pages/HabitWizard';
import { habitIconMap } from '@/lib/habit-utils';

interface EditHabitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHabitData: Partial<CreateHabitParams>;
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
  const [measurementType, setMeasurementType] = useState<MeasurementType>(initialHabitData.measurement_type || 'timer');
  const [xpPerUnit, setXpPerUnit] = useState(initialHabitData.xp_per_unit || 30);
  const [energyCostPerUnit, setEnergyCostPerUnit] = useState(initialHabitData.energy_cost_per_unit || 6);
  const [selectedIconName, setSelectedIconName] = useState<string>(initialHabitData.icon_name || 'Target');
  const [dependentOnHabitId, setDependentOnHabitId] = useState<string | null>(initialHabitData.dependent_on_habit_id || null);
  const [plateauDaysRequired, setPlateauDaysRequired] = useState(initialHabitData.plateau_days_required || 7);
  const [windowStart, setWindowStart] = useState<string | null>(initialHabitData.window_start || null);
  const [windowEnd, setWindowEnd] = useState<string | null>(initialHabitData.window_end || null);
  const [carryoverEnabled, setCarryoverEnabled] = useState(initialHabitData.carryover_enabled || false);
  const [shortDescription, setShortDescription] = useState(initialHabitData.short_description || '');
  const [growthType, setGrowthType] = useState<GrowthType>(initialHabitData.growth_type || 'fixed');
  const [growthValue, setGrowthValue] = useState(initialHabitData.growth_value || 1);
  const [weeklySessionMinDuration, setWeeklySessionMinDuration] = useState(initialHabitData.weekly_session_min_duration || 10); // New state

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
    setMeasurementType(initialHabitData.measurement_type || 'timer');
    setXpPerUnit(initialHabitData.xp_per_unit || 30);
    setEnergyCostPerUnit(initialHabitData.energy_cost_per_unit || 6);
    setSelectedIconName(initialHabitData.icon_name || 'Target');
    setDependentOnHabitId(initialHabitData.dependent_on_habit_id || null);
    setPlateauDaysRequired(initialHabitData.plateau_days_required || 7);
    setWindowStart(initialHabitData.window_start || null);
    setWindowEnd(initialHabitData.window_end || null);
    setCarryoverEnabled(initialHabitData.carryover_enabled || false);
    setShortDescription(initialHabitData.short_description || '');
    setGrowthType(initialHabitData.growth_type || 'fixed');
    setGrowthValue(initialHabitData.growth_value || 1);
    setWeeklySessionMinDuration(initialHabitData.weekly_session_min_duration || 10); // Initialize new state
  }, [initialHabitData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: Partial<CreateHabitParams> = {
      name: habitName,
      habit_key: habitKey.toLowerCase().replace(/\s/g, '_'),
      category: category,
      current_daily_goal: Math.round(dailyGoal),
      frequency_per_week: Math.round(frequency),
      is_trial_mode: isTrialMode,
      is_fixed: isFixed,
      anchor_practice: isAnchorPractice,
      auto_chunking: autoChunking,
      unit: unit,
      measurement_type: measurementType,
      xp_per_unit: Math.round(xpPerUnit),
      energy_cost_per_unit: energyCostPerUnit,
      icon_name: selectedIconName,
      dependent_on_habit_id: dependentOnHabitId,
      plateau_days_required: Math.round(plateauDaysRequired),
      window_start: windowStart,
      window_end: windowEnd,
      carryover_enabled: carryoverEnabled,
      short_description: shortDescription,
      growth_type: growthType,
      growth_value: growthValue,
      weekly_session_min_duration: Math.round(weeklySessionMinDuration), // Include new field
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
                  Refine your growth parameters.
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Core Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="habitName">Name *</Label>
                <Input id="habitName" value={habitName} onChange={(e) => setHabitName(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{habitUnits.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Weekly Anchor Specific Setting */}
          {category === 'anchor' && frequency === 1 && unit === 'min' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Session Minimum</h3>
              <div className="bg-info-background/50 p-4 rounded-2xl border border-info-border/50 space-y-2">
                <Label htmlFor="minDuration">Minimum Session Duration (minutes)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="minDuration"
                    type="number"
                    value={weeklySessionMinDuration}
                    onChange={(e) => setWeeklySessionMinDuration(Number(e.target.value))}
                    className="h-12 rounded-xl font-bold"
                    min={1}
                    required
                  />
                  <span className="font-bold text-lg">min</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  A session must be at least this long to count as 1 completed weekly session.
                </p>
              </div>
            </div>
          )}

          {!isFixed && unit !== 'dose' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Growth Increments</h3>
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={growthType === 'percentage' ? 'default' : 'outline'}
                    className="flex-1 rounded-xl h-12"
                    onClick={() => setGrowthType('percentage')}
                    disabled={dailyGoal === 1}
                  >
                    <Percent className="w-4 h-4 mr-2" /> Percentage
                  </Button>
                  <Button
                    type="button"
                    variant={growthType === 'fixed' ? 'default' : 'outline'}
                    className="flex-1 rounded-xl h-12"
                    onClick={() => setGrowthType('fixed')}
                  >
                    <Hash className="w-4 h-4 mr-2" /> Fixed Value
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Increase by</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={growthValue}
                      onChange={(e) => setGrowthValue(Number(e.target.value))}
                      className="h-12 rounded-xl font-bold"
                    />
                    <span className="font-bold text-lg">{growthType === 'percentage' ? '%' : unit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};