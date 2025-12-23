"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, Zap, Heart, BookOpen, Coffee, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step4_Barriers: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: 'forgetting', label: 'Forgetting', icon: AlertCircle },
    { id: 'time_pressure', label: 'Time Pressure', icon: Clock },
    { id: 'overwhelm', label: 'Overwhelm', icon: Zap },
    { id: 'perfectionism', label: 'Perfectionism', icon: Heart },
    { id: 'mood', label: 'Mood / Energy', icon: Coffee },
    { id: 'boredom', label: 'Boredom', icon: BookOpen },
  ];

  const toggleBarrier = (id: string) => {
    setWizardData(prev => {
      const current = prev.barriers || [];
      const next = current.includes(id) ? current.filter(b => b !== id) : [...current, id];
      return { ...prev, barriers: next, barriers_skipped: false };
    });
  };

  const handleSkip = () => {
    onSkip('barriers', ['time_pressure']); // Default to 'time_pressure' if skipped
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">What usually gets in the way? (Pick up to 3)</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select at least one option to continue.</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => {
            const isSelected = wizardData.barriers?.includes(opt.id);
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
                onClick={() => toggleBarrier(opt.id)}
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
          Skip / I don't know
        </Button>
      </CardContent>
    </Card>
  );
};