"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Bed, Briefcase, Link, X, ChevronRight } from 'lucide-react'; // Added ChevronRight
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void; // Added onSkip prop
}

export const Step5_DependencyCheck: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: 'after_waking', label: 'After waking', icon: Bed, desc: 'Start your day with this' },
    { id: 'after_work', label: 'After work', icon: Briefcase, desc: 'Transition from work to personal time' },
    { id: 'after_another_habit', label: 'After another habit', icon: Link, desc: 'Build a chain reaction' },
    { id: 'none', label: 'No dependency', icon: X, desc: 'This habit stands alone' },
  ];

  const handleSelect = (id: 'after_waking' | 'after_work' | 'after_another_habit' | 'none') => {
    setWizardData(prev => ({ ...prev, dependency_check: id, dependency_check_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('dependency_check', 'none'); // Default to 'none' if skipped
  };

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
                onClick={() => handleSelect(opt.id as 'after_waking' | 'after_work' | 'after_another_habit' | 'none')}
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