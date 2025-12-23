"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Bed, Briefcase, Link, X } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step5_DependencyCheck: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: 'after_waking', label: 'After waking', icon: Bed, desc: 'Start your day with this' },
    { id: 'after_work', label: 'After work', icon: Briefcase, desc: 'Transition from work to personal time' },
    { id: 'after_another_habit', label: 'After another habit', icon: Link, desc: 'Build a chain reaction' },
    { id: 'none', label: 'No dependency', icon: X, desc: 'This habit stands alone' },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Is this easier after something else?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = wizardData.dependency_check === opt.id;
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
                onClick={() => setWizardData(prev => ({ ...prev, dependency_check: opt.id as any }))}
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