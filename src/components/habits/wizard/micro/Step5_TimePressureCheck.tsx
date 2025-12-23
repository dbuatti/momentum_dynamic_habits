"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, Calendar, HelpCircle } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step5_TimePressureCheck: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: 'always', label: 'Yes, always', icon: Calendar, desc: 'Show it no matter what' },
    { id: 'only_if_time', label: 'Only if there’s time', icon: Clock, desc: 'Hide if busy' },
    { id: 'decide_later', label: 'Let me decide', icon: HelpCircle, desc: 'Flexible visibility' },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">On busy days, should this still show up?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = wizardData.time_pressure_check === opt.id;
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
                onClick={() => setWizardData(prev => ({ ...prev, time_pressure_check: opt.id as any }))}
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