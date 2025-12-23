"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, Frown, Meh } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step4_MissedDayResponse: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: 'keep_going', label: 'I keep going', icon: ArrowRight, desc: 'No big deal' },
    { id: 'discouraged', label: 'I feel discouraged', icon: Meh, desc: 'Loses momentum' },
    { id: 'stop_completely', label: 'I stop completely', icon: Frown, desc: 'All or nothing' },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Frown className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">If you miss a day, what tends to happen next?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = wizardData.missed_day_response === opt.id;
            const Icon = opt.icon;
            return (
              <Button
                key={opt.id}
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start gap-3",
                  isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => setWizardData(prev => ({ ...prev, missed_day_response: opt.id as any }))}
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