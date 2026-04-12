"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, Calendar, HelpCircle, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step5_TimePressureCheck: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: 'always', label: 'Yes, always', icon: Calendar, desc: 'Show it no matter what' },
    { id: 'only_if_time', label: 'Only if there’s time', icon: Clock, desc: 'Hide if busy' },
    { id: 'decide_later', label: 'Let me decide', icon: HelpCircle, desc: 'Flexible visibility' },
  ];

  const handleSelect = (id: 'always' | 'only_if_time' | 'decide_later') => {
    setWizardData(prev => ({ ...prev, time_pressure_check: id, time_pressure_check_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('time_pressure_check', 'decide_later'); // Default to 'decide_later' if skipped
  };

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
                onClick={() => handleSelect(opt.id as 'always' | 'only_if_time' | 'decide_later')}
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