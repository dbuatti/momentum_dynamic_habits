"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Layers, RotateCcw } from 'lucide-react';
import { habitCategories, habitTemplates } from '@/lib/habit-templates';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { HabitCategory as HabitCategoryType } from '@/types/habit';
import { Button } from '@/components/ui/button';

interface HabitWizardStep1Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
  onResetProgress: () => void;
  hasSavedProgress: boolean;
}

export const HabitWizardStep1: React.FC<HabitWizardStep1Props> = ({ wizardData, setWizardData, onResetProgress, hasSavedProgress }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">What kind of habit do you want to build?</h2>
        <p className="text-muted-foreground">Choose an area to focus on. You can always customize later.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {habitCategories.filter(cat => cat.value !== 'anchor').map((cat) => {
          const Icon = cat.icon;
          const isSelected = wizardData.category === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              className={cn(
                "border rounded-xl p-3 cursor-pointer transition-all text-left",
                isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted/50'
              )}
              onClick={() => {
                const template = habitTemplates.find(t => t.category === cat.value && t.defaultMode === 'Trial');
                setWizardData(prev => ({
                  ...prev,
                  category: cat.value as HabitCategoryType,
                  unit: template?.unit || 'min',
                  icon_name: template?.icon_name || cat.icon_name,
                  name: template?.name || '',
                  habit_key: template?.id || '',
                  daily_goal: template?.defaultDuration || 15,
                  frequency_per_week: template?.defaultFrequency || 3,
                  is_trial_mode: true,
                  is_fixed: false,
                  anchor_practice: template?.anchorPractice || false,
                  auto_chunking: template?.autoChunking || true,
                  xp_per_unit: template?.xpPerUnit || 30,
                  energy_cost_per_unit: template?.energyCostPerUnit || 6,
                  plateau_days_required: template?.plateauDaysRequired || 7,
                  short_description: template?.shortDescription || '',
                }));
              }}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
                <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {hasSavedProgress && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetProgress}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Reset Saved Progress
          </Button>
        </div>
      )}
    </div>
  );
};