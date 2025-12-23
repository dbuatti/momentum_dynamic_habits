"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sunrise, Sun, Sunset, Moon, Clock } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step5_TimeOfDayFit: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: 'morning', label: 'Morning', icon: Sunrise },
    { id: 'afternoon', label: 'Afternoon', icon: Sun },
    { id: 'evening', label: 'Evening', icon: Moon },
    { id: 'flexible', label: 'Flexible', icon: Clock },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">When does this naturally belong?</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => {
            const isSelected = wizardData.time_of_day_fit === opt.id;
            const Icon = opt.icon;
            return (
              <Button
                key={opt.id}
                type="button"
                variant="outline"
                className={cn(
                  "h-12 justify-start gap-2 text-sm",
                  isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => setWizardData(prev => ({ ...prev, time_of_day_fit: opt.id as any }))}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};