"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { habitCategories, habitUnits, habitModes, habitIcons } from '@/lib/habit-templates';
import { habitIconMap } from '@/lib/habit-utils';
import { useJourneyData } from '@/hooks/useJourneyData';
import { timeOptions } from '@/utils/time-utils'; // Import from new utility

interface StructuredOverviewProps {
  wizardData: Partial<WizardHabitData>;
}

export const StructuredOverview: React.FC<StructuredOverviewProps> = ({ wizardData }) => {
  const { data: journeyData } = useJourneyData();
  const allHabits = journeyData?.allHabits || [];

  const getCategoryLabel = (value?: string) => habitCategories.find(c => c.value === value)?.label || value || 'N/A';
  const getUnitLabel = (value?: string) => habitUnits.find(u => u.value === value)?.label || value || 'N/A';
  const getModeLabel = (isTrial?: boolean, isFixed?: boolean) => {
    if (isFixed) return 'Fixed (Maintenance)';
    if (isTrial) return 'Trial Phase';
    return 'Adaptive Growth';
  };
  const getIconComponent = (iconName?: string) => habitIcons.find(i => i.value === iconName)?.icon || habitIconMap.custom_habit;
  const getDependentHabitName = (id?: string | null) => {
    if (!id) return 'None';
    return allHabits.find(h => h.id === id)?.name || 'Unknown Habit';
  };
  const getTimeWindowLabel = (start?: string | null, end?: string | null) => {
    if (start && end) return `${start} - ${end}`;
    return 'Anytime';
  };

  const IconComponent = getIconComponent(wizardData.icon_name);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Structured Overview</h2>
      <p className="text-muted-foreground text-center">A clear, two-column layout of your habit's settings.</p>

      <Card className="border-border shadow-sm rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-lg mb-3">Habit Details</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <Label className="font-medium text-muted-foreground">Habit Name</Label>
            <span className="font-semibold text-foreground">{wizardData.name || 'N/A'}</span>

            <Label className="font-medium text-muted-foreground">Category</Label>
            <span className="font-semibold text-foreground">{getCategoryLabel(wizardData.category)}</span>

            <Label className="font-medium text-muted-foreground">Unit</Label>
            <span className="font-semibold text-foreground">{getUnitLabel(wizardData.unit)}</span>

            <Label className="font-medium text-muted-foreground">Icon</Label>
            <span className="font-semibold text-foreground flex items-center gap-2">
              <IconComponent className="w-4 h-4" /> {wizardData.icon_name || 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-lg mb-3">Goals & Schedule</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <Label className="font-medium text-muted-foreground">Daily Goal</Label>
            <span className="font-semibold text-foreground">{wizardData.daily_goal || 'N/A'} {wizardData.unit || ''}</span>

            <Label className="font-medium text-muted-foreground">Weekly Frequency</Label>
            <span className="font-semibold text-foreground">{wizardData.frequency_per_week || 'N/A'}x per week</span>

            <Label className="font-medium text-muted-foreground">Estimated Weekly Total</Label>
            <span className="font-semibold text-foreground">{(wizardData.daily_goal || 0) * (wizardData.frequency_per_week || 0)} {wizardData.unit || ''}</span>

            <Label className="font-medium text-muted-foreground">Time Window</Label>
            <span className="font-semibold text-foreground">{getTimeWindowLabel(wizardData.window_start, wizardData.window_end)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-lg mb-3">Growth & Behavior Logic</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <Label className="font-medium text-muted-foreground">Habit Mode</Label>
            <span className="font-semibold text-foreground">{getModeLabel(wizardData.is_trial_mode, wizardData.is_fixed)}</span>

            <Label className="font-medium text-muted-foreground">Growth Threshold</Label>
            <span className="font-semibold text-foreground">{wizardData.plateau_days_required || 'N/A'} days</span>

            <Label className="font-medium text-muted-foreground">Auto-Chunking</Label>
            <span className="font-semibold text-foreground">{wizardData.auto_chunking ? 'Enabled' : 'Disabled'}</span>

            <Label className="font-medium text-muted-foreground">Anchor Practice</Label>
            <span className="font-semibold text-foreground">{wizardData.anchor_practice ? 'Yes' : 'No'}</span>

            <Label className="font-medium text-muted-foreground">Dependency</Label>
            <span className="font-semibold text-foreground">{getDependentHabitName(wizardData.dependent_on_habit_id)}</span>

            <Label className="font-medium text-muted-foreground">Carryover</Label>
            <span className="font-semibold text-foreground">{wizardData.carryover_enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-lg mb-3">System Values</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <Label className="font-medium text-muted-foreground">XP per {wizardData.unit || 'unit'}</Label>
            <span className="font-semibold text-foreground">{wizardData.xp_per_unit || 'N/A'}</span>

            <Label className="font-medium text-muted-foreground">Energy Cost per {wizardData.unit || 'unit'}</Label>
            <span className="font-semibold text-foreground">{wizardData.energy_cost_per_unit || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground italic text-center mt-8">
        Nothing is locked forever. You can adjust any of this later in Settings.
      </p>
    </div>
  );
};