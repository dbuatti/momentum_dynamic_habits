"use client";

import React, { useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Info, Zap, Calendar, Heart } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { cn } from '@/lib/utils';

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
        <h2 className="text-2xl font-bold mb-2">Let's make this habit doable in real life</h2>
        <p className="text-muted-foreground">What tends to get in the way — so we can design around it?</p>
      </div>

      {/* This component is deprecated in the micro-step flow. */}
      {/* The content below is placeholder or should be removed if this component is truly unused. */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">This step is deprecated</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            The Habit Wizard now uses a more granular micro-step flow. This component is no longer actively used
            but is kept for compatibility.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};