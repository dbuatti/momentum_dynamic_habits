"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Heart, Meh, AlertCircle, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step4_SensitivitySetting: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: 'gentle', label: 'Be Gentle', icon: Heart, desc: 'Soft language, no pressure' },
    { id: 'neutral', label: 'Be Neutral', icon: Meh, desc: 'Factual, no emotion' },
    { id: 'direct', label: 'Be Direct', icon: AlertCircle, desc: 'Clear, firm reminders' },
  ];

  const handleSelect = (id: 'gentle' | 'neutral' | 'direct') => {
    setWizardData(prev => ({ ...prev, sensitivity_setting: id, sensitivity_setting_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('sensitivity_setting', 'neutral'); // Default to 'neutral' if skipped
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">How should the app respond when things go off track?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = wizardData.sensitivity_setting === opt.id;
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
                onClick={() => handleSelect(opt.id as 'gentle' | 'neutral' | 'direct')}
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