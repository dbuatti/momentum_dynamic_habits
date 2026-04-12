"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, Flame, Target, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step3_ConsistencyReality: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: '1-2_days', label: '1-2 Days', icon: Calendar, desc: 'Low pressure start' },
    { id: '3-4_days', label: '3-4 Days', icon: Target, desc: 'Realistic rhythm' },
    { id: 'most_days', label: 'Most Days', icon: Flame, desc: 'Strong habit' },
    { id: 'daily', label: 'Daily', icon: Flame, desc: 'Automatic mode' },
  ];

  const handleSelect = (id: '1-2_days' | '3-4_days' | 'most_days' | 'daily') => {
    setWizardData(prev => ({ ...prev, consistency_reality: id, consistency_reality_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('consistency_reality', '3-4_days'); // Default to '3-4_days' if skipped
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Realistically, how often could this happen right now?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select an option to continue.</p>
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
                onClick={() => handleSelect(opt.id as '1-2_days' | '3-4_days' | 'most_days' | 'daily')}
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
          Skip / I don't know
        </Button>
      </CardContent>
    </Card>
  );
};