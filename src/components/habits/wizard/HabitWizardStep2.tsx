"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Lightbulb, Info, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { motivationTypes } from '@/lib/habit-templates';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button'; // Ensure Button is imported

interface HabitWizardStep2Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const HabitWizardStep2: React.FC<HabitWizardStep2Props> = ({ wizardData, setWizardData, onSkip }) => {
  const handleSelect = (motivation: typeof motivationTypes[number]) => {
    setWizardData(prev => ({
      ...prev,
      motivation_type: motivation.value as WizardHabitData['motivation_type'],
      motivation_type_skipped: false,
      anchor_practice: (motivation.value === 'routine_building' || motivation.value === 'stress_reduction'),
    }));
  };

  const handleSkip = () => {
    onSkip('motivation_type', 'personal_growth'); // Default to 'personal_growth' if skipped
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lightbulb className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Why is this habit important to you?</h2>
        <p className="text-muted-foreground">Understanding your motivation helps us tailor guidance.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {motivationTypes.map((motivation) => {
          const Icon = motivation.icon;
          const isSelected = wizardData.motivation_type === motivation.value;
          return (
            <button
              key={motivation.value}
              type="button"
              className={cn(
                "border rounded-xl p-3 cursor-pointer transition-all text-left",
                isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted/50'
              )}
              onClick={() => handleSelect(motivation)}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
                <span className="text-xs font-bold text-center leading-tight">{motivation.label}</span>
              </div>
            </button>
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
    </div>
  );
};