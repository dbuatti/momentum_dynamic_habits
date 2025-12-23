"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sunrise, Sun, Sunset, Moon, Clock, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step5_TimeOfDayFit: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: 'morning', label: 'Morning', icon: Sunrise },
    { id: 'midday', label: 'Midday', icon: Sun },
    { id: 'afternoon', label: 'Afternoon', icon: Sunset },
    { id: 'evening', label: 'Evening', icon: Moon },
    { id: 'anytime', label: 'Anytime / Flexible', icon: Clock },
  ];

  const handleSelect = (id: 'morning' | 'midday' | 'afternoon' | 'evening' | 'anytime') => {
    setWizardData(prev => ({ ...prev, time_of_day_fit: id, time_of_day_fit_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('time_of_day_fit', 'anytime'); // Default to 'anytime' if skipped
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">When does this naturally belong?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
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
                onClick={() => handleSelect(opt.id as 'morning' | 'midday' | 'afternoon' | 'evening' | 'anytime')}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
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