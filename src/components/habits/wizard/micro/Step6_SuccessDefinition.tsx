"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Target, CheckCircle2, Star, ChevronRight, Zap, ListChecks } from 'lucide-react'; 
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onSkip: (field: keyof WizardHabitData, defaultValue: any) => void;
}

export const Step6_SuccessDefinition: React.FC<Props> = ({ wizardData, setWizardData, onSkip }) => {
  const options = [
    { id: 'sometimes', label: 'Showing up sometimes', icon: Target, desc: 'Any progress counts' },
    { id: 'most_weeks', label: 'Doing it most weeks', icon: CheckCircle2, desc: 'Consistent rhythm' },
    { id: 'automatic', label: 'Making it automatic', icon: Star, desc: 'Habit formed' },
  ];

  const handleSelect = (id: 'sometimes' | 'most_weeks' | 'automatic') => {
    setWizardData(prev => ({ ...prev, success_definition: id, success_definition_skipped: false }));
  };

  const handleSkip = () => {
    onSkip('success_definition', 'most_weeks');
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">This habit is successful if...</h3>
          </div>
          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = wizardData.success_definition === opt.id;
              const Icon = opt.icon;
              return (
                <Button
                  key={opt.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-3 h-14",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => handleSelect(opt.id as 'sometimes' | 'most_weeks' | 'automatic')}
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
        </div>

        {/* NEW: Completion Behavior Toggle */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ListChecks className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Completion Behavior</h3>
          </div>
          
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-black text-xs uppercase tracking-tight">Complete goal on stop?</Label>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[200px]">
                If ON, finishing a session marks the whole goal done (e.g. Teeth Brushing). 
                If OFF, it only saves elapsed time (e.g. Reading).
              </p>
            </div>
            <Switch 
              checked={wizardData.complete_on_finish ?? true}
              onCheckedChange={(val) => setWizardData(prev => ({ ...prev, complete_on_finish: val }))}
            />
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground hover:text-primary justify-center mt-2"
          onClick={handleSkip}
        >
          <ChevronRight className="w-4 h-4 mr-2" />
          Skip / I don't mind
        </Button>
      </CardContent>
    </Card>
  );
};