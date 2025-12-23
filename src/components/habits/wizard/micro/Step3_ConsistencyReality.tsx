"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, Flame, Target } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step3_ConsistencyReality: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: '1-2_days', label: '1-2 Days', icon: Calendar, desc: 'Low pressure start' },
    { id: '3-4_days', label: '3-4 Days', icon: Target, desc: 'Realistic rhythm' },
    { id: 'most_days', label: 'Most Days', icon: Flame, desc: 'Strong habit' },
    { id: 'daily', label: 'Daily', icon: Flame, desc: 'Automatic mode' },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Realistically, how often could this happen right now?</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {options.map((opt) => {
            const isSelected = wizardData.consistency_reality === opt.id;
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
                onClick={() => setWizardData(prev => ({ ...prev, consistency_reality: opt.id as any }))}
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