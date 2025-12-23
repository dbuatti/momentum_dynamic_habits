"use client";

import React, { useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Info, Zap, Calendar, Heart } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface HabitWizardStep3Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const HabitWizardStep3: React.FC<HabitWizardStep3Props> = ({ wizardData, setWizardData }) => {
  // This component is deprecated in the micro-step flow but kept for compatibility.
  // It now maps to the new granular fields if used, or relies on defaults.
  // Since the new flow uses micro-steps, this component is effectively unused 
  // unless the user skips the micro-steps or loads old data.
  // We will map the old fields to the new ones for safety.

  const suggestedDailyGoal = useMemo(() => {
    // Map old fields to new ones if they exist, otherwise default
    const energy = wizardData.energy_per_session || 'moderate';
    let duration = 15;
    if (energy === 'very_little') duration = 5;
    if (energy === 'a_bit') duration = 10;
    if (energy === 'moderate') duration = 20;
    if (energy === 'plenty') duration = 30;
    
    const frequency = wizardData.consistency_reality === 'daily' ? 7 : 
                      wizardData.consistency_reality === 'most_days' ? 5 : 3;
    
    return duration;
  }, [wizardData.energy_per_session, wizardData.consistency_reality]);

  // Auto-update derived fields
  useEffect(() => {
    // If we have granular data, update the summary fields
    if (wizardData.energy_per_session || wizardData.consistency_reality || wizardData.confidence_check) {
      const calculatedParams = {
        daily_goal: suggestedDailyGoal,
        frequency_per_week: wizardData.consistency_reality === 'daily' ? 7 : 
                            wizardData.consistency_reality === 'most_days' ? 5 : 
                            wizardData.consistency_reality === '1-2_days' ? 2 : 3,
      };
      
      setWizardData(prev => ({
        ...prev,
        daily_goal: calculatedParams.daily_goal,
        frequency_per_week: calculatedParams.frequency_per_week,
      }));
    }
  }, [wizardData.energy_per_session, wizardData.consistency_reality, wizardData.confidence_check, suggestedDailyGoal, setWizardData]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Current Capacity</h2>
        <p className="text-muted-foreground">Let's figure out a realistic starting point.</p>
      </div>

      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Auto-Calculated Goals</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on your micro-step answers, we suggest:
          </p>
          <ul className="space-y-1 text-sm text-foreground">
            <li>• Daily Goal: <span className="font-semibold text-primary">{suggestedDailyGoal} min</span></li>
            <li>• Frequency: <span className="font-semibold text-primary">{wizardData.consistency_reality === 'daily' ? 7 : wizardData.consistency_reality === 'most_days' ? 5 : 3} days/week</span></li>
          </ul>
        </CardContent>
      </Card>

      {/* Legacy Sliders (Hidden or Disabled if using micro-steps, but kept for fallback) */}
      <Card className="border-border opacity-50 pointer-events-none">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Manual Override (Optional)</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Session Duration (min)</Label>
              <Slider
                min={5}
                max={60}
                step={5}
                value={[wizardData.daily_goal || suggestedDailyGoal]}
                onValueChange={(val) => setWizardData(prev => ({ ...prev, daily_goal: val[0] }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Weekly Frequency</Label>
              <Slider
                min={1}
                max={7}
                step={1}
                value={[wizardData.frequency_per_week || 3]}
                onValueChange={(val) => setWizardData(prev => ({ ...prev, frequency_per_week: val[0] }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};