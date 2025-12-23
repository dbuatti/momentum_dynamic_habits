"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Zap, BatteryLow, BatteryMedium, Battery, BatteryFull } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step3_EnergyPerSession: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: 'very_little', label: 'Very Little', icon: BatteryLow, desc: '5-10 min / small reps' },
    { id: 'a_bit', label: 'A Bit', icon: BatteryMedium, desc: '10-20 min / moderate reps' },
    { id: 'moderate', label: 'Moderate', icon: Battery, desc: '20-30 min / standard reps' },
    { id: 'plenty', label: 'Plenty', icon: BatteryFull, desc: '30+ min / high reps' },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">On a normal day, how much energy could you give this?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const isSelected = wizardData.energy_per_session === opt.id;
            const Icon = opt.icon;
            return (
              <Button
                key={opt.id}
                type="button"
                variant="outline"
                className={cn(
                  "h-16 flex-col items-start gap-1 p-3",
                  isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => setWizardData(prev => ({ ...prev, energy_per_session: opt.id as any }))}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold">{opt.label}</span>
                </div>
                <span className="text-[10px] opacity-70">{opt.desc}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};