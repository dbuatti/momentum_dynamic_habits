"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Heart, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { Button } from '@/components/ui/button'; // Ensure Button is imported

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step3_ConfidenceCheck: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const handleValueChange = (val: number[]) => {
    setWizardData(prev => ({ ...prev, confidence_check: val[0], confidence_check_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('confidence_check', 5); // Default to 5 if skipped
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">How confident are you that you could do this for a week?</h3>
        </div>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[wizardData.confidence_check || 5]}
          onValueChange={handleValueChange}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Low</span>
          <span className="font-bold text-primary">{wizardData.confidence_check || 5}/10</span>
          <span>High</span>
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