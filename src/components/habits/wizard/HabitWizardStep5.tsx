"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Calendar, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Target,
  Zap,
  Sun,
  Moon,
  Sunset,
  Sunrise
} from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { useJourneyData } from '@/hooks/useJourneyData';

interface HabitWizardStep5Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

// Time-of-Day options with system mapping
const timeOfDayOptions = [
  { id: 'morning', label: 'Morning', icon: Sunrise, start: '06:00', end: '10:00' },
  { id: 'midday', label: 'Midday', icon: Sun, start: '10:00', end: '14:00' },
  { id: 'afternoon', label: 'Afternoon', icon: Sunset, start: '14:00', end: '18:00' },
  { id: 'evening', label: 'Evening', icon: Moon, start: '18:00', end: '22:00' },
  { id: 'anytime', label: 'Anytime / Flexible', icon: Clock, start: null, end: null },
];

export const HabitWizardStep5: React.FC<HabitWizardStep5Props> = ({ wizardData, setWizardData }) => {
  const { data: journeyData } = useJourneyData();
  
  // Get existing habits for dependency selection
  const existingHabits = useMemo(() => {
    return journeyData?.allHabits || [];
  }, [journeyData?.allHabits]);

  // Handle Time-of-Day selection
  const handleTimeOfDaySelect = (id: string) => {
    const selected = timeOfDayOptions.find(opt => opt.id === id);
    if (selected) {
      setWizardData(prev => ({
        ...prev,
        window_start: selected.start,
        window_end: selected.end,
        timing_preference: id, // Store the preference ID
      }));
    }
  };

  // Handle Flexibility selection
  const handleFlexibilitySelect = (value: string) => {
    setWizardData(prev => ({
      ...prev,
      flexibility: value as WizardHabitData['flexibility'],
    }));
  };

  // Handle Dependency Selection
  const handleDependencyChange = (value: string) => {
    const habitId = value === 'none' ? null : value;
    setWizardData(prev => ({
      ...prev,
      dependent_on_habit_id: habitId,
    }));
  };

  // Handle Soft Lock Checkbox
  const handleSoftLockToggle = (checked: boolean) => {
    setWizardData(prev => ({
      ...prev,
      soft_lock: checked,
    }));
  };

  // Handle Sequencing Bias
  const handleSequenceBias = (value: string) => {
    setWizardData(prev => ({
      ...prev,
      sequence_bias: value as WizardHabitData['sequence_bias'],
    }));
  };

  // Handle Missed Timing Safety Net
  const handleSafetyNet = (value: string) => {
    const carryoverEnabled = value === 'rollover' || value === 'gentle';
    setWizardData(prev => ({
      ...prev,
      carryover_enabled: carryoverEnabled,
      safety_net_choice: value as "none" | "rollover" | "gentle", // Explicit cast to fix TS error
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">When this fits best — and what needs to happen first</h2>
        <p className="text-muted-foreground">Let's set soft boundaries so this habit feels supported, not scheduled.</p>
      </div>

      {/* Section 1: Time-of-Day Fit */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">When does this feel easiest?</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Select the time block that fits your natural rhythm.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {timeOfDayOptions.map((option) => {
              const isSelected = wizardData.timing_preference === option.id;
              const Icon = option.icon;
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-12 justify-start gap-2 text-sm",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => handleTimeOfDaySelect(option.id)}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Flexibility Check */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">How strict does this timing need to be?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'strict', label: 'It needs a clear window' },
              { id: 'flexible', label: 'I want flexibility day to day' },
              { id: 'none', label: "I don't want to think about timing" },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start gap-2",
                  wizardData.flexibility === option.id && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => handleFlexibilitySelect(option.id)}
              >
                <div className={cn("w-4 h-4 rounded-full border border-current", wizardData.flexibility === option.id ? "bg-primary-foreground" : "opacity-30")} />
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Dependencies */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Does this habit need to wait for another?</h3>
          </div>
          
          <div className="space-y-3">
            <Select value={wizardData.dependent_on_habit_id || 'none'} onValueChange={handleDependencyChange}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select prerequisite habit">
                  {wizardData.dependent_on_habit_id 
                    ? existingHabits.find(h => h.id === wizardData.dependent_on_habit_id)?.name || "Unknown Habit"
                    : "No prerequisite — stands alone"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No prerequisite — stands alone</SelectItem>
                {existingHabits.map(habit => (
                  <SelectItem key={habit.id} value={habit.id}>
                    {habit.name || habit.habit_key.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {wizardData.dependent_on_habit_id && (
              <div className="flex items-center gap-2 mt-2">
                <Checkbox 
                  id="softLock" 
                  checked={wizardData.soft_lock || false}
                  onCheckedChange={handleSoftLockToggle}
                />
                <Label htmlFor="softLock" className="text-sm font-medium cursor-pointer">
                  Lock this habit until prerequisite is done
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Sequencing Preference */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">How do you want this to appear?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'early', label: 'As early as possible' },
              { id: 'after_core', label: 'After core responsibilities' },
              { id: 'energy_based', label: 'Whenever there’s energy' },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start gap-2",
                  wizardData.sequence_bias === option.id && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => handleSequenceBias(option.id)}
              >
                <div className={cn("w-4 h-4 rounded-full border border-current", wizardData.sequence_bias === option.id ? "bg-primary-foreground" : "opacity-30")} />
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Missed Timing Safety Net */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">If you miss this today, what should happen?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'none', label: 'Let it go (no penalty)' },
              { id: 'rollover', label: 'Roll unused time into tomorrow' },
              { id: 'gentle', label: 'Keep it visible but gentle' },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start gap-2",
                  wizardData.safety_net_choice === option.id && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => handleSafetyNet(option.id)}
              >
                <div className={cn("w-4 h-4 rounded-full border border-current", wizardData.safety_net_choice === option.id ? "bg-primary-foreground" : "opacity-30")} />
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary / Auto-Generated Settings */}
      <Card className="bg-muted/30 border-dashed border-border">
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-bold text-foreground">Based on your answers:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Window: <span className="font-semibold text-primary">
              {wizardData.window_start ? `${wizardData.window_start} - ${wizardData.window_end}` : 'Anytime'}
            </span></li>
            <li>• Dependency: <span className="font-semibold text-primary">
              {wizardData.dependent_on_habit_id ? `Locked until prerequisite done` : 'None'}
            </span></li>
            <li>• Carryover: <span className="font-semibold text-primary">
              {wizardData.carryover_enabled ? 'Enabled' : 'Disabled'}
            </span></li>
            <li>• Dashboard Order: <span className="font-semibold text-primary">
              {wizardData.sequence_bias === 'early' ? 'Top' : wizardData.sequence_bias === 'after_core' ? 'After Anchors' : 'Flexible'}
            </span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};