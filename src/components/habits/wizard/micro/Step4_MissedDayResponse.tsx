"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, Frown, Meh, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step4_MissedDayResponse: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: 'keep_going', label: 'I keep going', icon: ArrowRight, desc: 'No big deal' },
    { id: 'discouraged', label: 'I feel discouraged', icon: Meh, desc: 'Loses momentum' },
    { id: 'stop_completely', label: 'I stop completely', icon: Frown, desc: 'All or nothing' },
  ];

  const handleSelect = (id: 'keep_going' | 'discouraged' | 'stop_completely') => {
    setWizardData(prev => ({ ...prev, missed_day_response: id, missed_day_response_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('missed_day_response', 'keep_going'); // Default to 'keep_going' if skipped
  };

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
                onClick={() => handleSelect(opt.id as 'keep_going' | 'discouraged' | 'stop_completely')}
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
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground hover:text-primary justify-center mt-4"
          onClick={handleSkip}
        >
          <ChevronRight className="w-4 h-4 mr-2" />
          Skip / I don't mind
        </Button>
      </CardContent>
    </Card>
  );
};