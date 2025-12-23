"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Pause, MinusCircle, HelpCircle } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const Step6_FailureResponse: React.FC<Props> = ({ wizardData, setWizardData }) => {
  const options = [
    { id: 'pause', label: 'Pause growth', icon: Pause, desc: 'Freeze if struggling' },
    { id: 'reduce', label: 'Reduce goals', icon: MinusCircle, desc: 'Lower the bar' },
    { id: 'ask', label: 'Ask me', icon: HelpCircle, desc: 'Don\'t assume' },
  ];

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Pause className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">If this starts to feel like too much...</h3>
        </div>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = wizardData.failure_response === opt.id;
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
                onClick={() => setWizardData(prev => ({ ...prev, failure_response: opt.id as any }))}
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