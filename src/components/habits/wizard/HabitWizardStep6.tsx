"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Zap, ShieldCheck, Heart } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { cn } from '@/lib/utils';

interface HabitWizardStep6Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const HabitWizardStep6: React.FC<HabitWizardStep6Props> = ({ wizardData, setWizardData }) => {
  // This component is deprecated in the micro-step flow but kept for compatibility.
  // It displays a summary based on the new granular fields.

  const getSummary = () => {
    const lines: string[] = [];

    // Growth Appetite
    if (wizardData.growth_appetite === 'steady') lines.push("• No growth pressure");
    else if (wizardData.growth_appetite === 'suggest') lines.push("• Suggests growth gently");
    else if (wizardData.growth_appetite === 'auto') lines.push("• Automatically grows");

    // Timing
    if (wizardData.time_of_day_fit && wizardData.time_of_day_fit !== 'flexible') {
      lines.push(`• Lives in the ${wizardData.time_of_day_fit}`);
    }

    // Dependencies
    if (wizardData.dependency_check && wizardData.dependency_check !== 'none') {
      lines.push(`• Unlocks after ${wizardData.dependency_check.replace(/_/g, ' ')}`);
    }

    // Failure Protection
    if (wizardData.failure_response === 'pause') lines.push("• Pauses if struggling");
    if (wizardData.failure_response === 'reduce') lines.push("• Reduces goals if needed");

    return lines;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Confidence & Growth</h2>
        <p className="text-muted-foreground">How this habit behaves long-term.</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-primary">System Summary</h3>
          </div>
          <ul className="space-y-1 text-sm text-primary/80">
            {getSummary().length > 0 ? (
              getSummary().map((line, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{line}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Select options in the micro-steps to see your habit's behavior summary.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground italic text-center">
          "This habit doesn't need willpower. It needs a system that understands you."
        </p>
      </div>
    </div>
  );
};