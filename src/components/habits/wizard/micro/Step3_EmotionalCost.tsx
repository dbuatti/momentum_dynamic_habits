"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Heart, Meh, Frown, Smile } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step3_EmotionalCost: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: 'light', label: 'Light / Neutral', icon: Smile, desc: 'Easy to start' },
    { id: 'some_resistance', label: 'Some Resistance', icon: Meh, desc: 'Needs a push' },
    { id: 'heavy', label: 'Heavy / Draining', icon: Frown, desc: 'High friction' },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">How does this habit *feel* to start?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
        <div className="grid grid-cols-1 gap-3">
          {options.map((opt) => {
            const isSelected = wizardData.emotional_cost === opt.id;
            const Icon = opt.icon;
            return (
              <Button
                key={opt.id}
                type="button"
                variant="outline"
                className={cn(
                  "h-14 justify-start gap-3",
                  isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => setWizardData(prev => ({ ...prev, emotional_cost: opt.id as any }))}
              >
                <Icon className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span className="font-bold">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.desc}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};