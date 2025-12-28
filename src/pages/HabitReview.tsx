"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { StructuredOverview } from '@/components/habits/wizard/review/StructuredOverview';
import { NarrativeSummary } from '@/components/habits/wizard/review/NarrativeSummary';
import { CheckCircle2, Edit2, Save, X, Target, ArrowLeft } from 'lucide-react';
import { useJourneyData } from '@/hooks/useJourneyData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { CreateHabitParams } from './HabitWizard';

interface HabitReviewStepProps {
  wizardData: Partial<WizardHabitData>;
  onEditDetails: (data: Partial<CreateHabitParams>) => void;
  onSaveAndFinishLater: () => Promise<void>;
  onCreateHabit: () => Promise<void>;
  onDiscardDraft: (habitKey: string) => Promise<void>;
  isSaving: boolean;
  isCreating: boolean;
  isTemplateMode?: boolean;
}

export const HabitReviewStep: React.FC<HabitReviewStepProps> = ({
  wizardData,
  onEditDetails,
  onSaveAndFinishLater,
  onCreateHabit,
  onDiscardDraft,
  isSaving,
  isCreating,
  isTemplateMode = false,
}) => {
  const [reviewMode, setReviewMode] = useState<'structured' | 'narrative'>('narrative');
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const isFormValid = useMemo(() => {
    return wizardData.name?.trim() && wizardData.habit_key?.trim() && wizardData.category;
  }, [wizardData]);

  const editableHabitData: Partial<CreateHabitParams> = useMemo(() => ({
    name: wizardData.name,
    habit_key: wizardData.habit_key,
    category: wizardData.category as any,
    current_daily_goal: wizardData.daily_goal,
    frequency_per_week: wizardData.frequency_per_week,
    is_trial_mode: wizardData.is_trial_mode,
    is_fixed: wizardData.is_fixed,
    anchor_practice: wizardData.anchor_practice,
    auto_chunking: wizardData.auto_chunking,
    unit: wizardData.unit,
    xp_per_unit: wizardData.xp_per_unit,
    energy_cost_per_unit: wizardData.energy_cost_per_unit,
    icon_name: wizardData.icon_name,
    dependent_on_habit_id: wizardData.dependent_on_habit_id,
    plateau_days_required: wizardData.plateau_days_required,
    window_start: wizardData.window_start,
    window_end: wizardData.window_end,
    carryover_enabled: wizardData.carryover_enabled,
    short_description: wizardData.short_description,
    weekly_session_min_duration: wizardData.weekly_session_min_duration,
  }), [wizardData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight italic">Review Lab Results</h2>
        <p className="text-muted-foreground font-medium">
          Here's the design for your new practice. Review it as a story or data.
        </p>
      </div>

      <div className="flex justify-center">
        <SegmentedControl
          options={[
            { label: 'Narrative Summary', value: 'narrative' },
            { label: 'Structured Data', value: 'structured' },
          ]}
          value={reviewMode}
          onValueChange={(value) => setReviewMode(value as 'structured' | 'narrative')}
        />
      </div>

      <div className="bg-muted/10 rounded-[2rem] p-2">
        {reviewMode === 'structured' ? (
          <StructuredOverview wizardData={wizardData} />
        ) : (
          <NarrativeSummary wizardData={wizardData} neurodivergentMode={neurodivergentMode} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-border/50">
        <Button
          type="button"
          className="h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 order-1 sm:order-2"
          onClick={onCreateHabit}
          disabled={isCreating || isSaving || !isFormValid}
        >
          {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6 mr-2" /> Launch Practice</>}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-16 rounded-2xl font-bold text-lg order-2 sm:order-1 gap-2"
          onClick={() => onEditDetails(editableHabitData)}
          disabled={isCreating || isSaving}
        >
          <Edit2 className="w-5 h-5" /> Adjust Details
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground">
        {!isTemplateMode && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="font-black uppercase text-[10px] tracking-[0.2em] hover:text-primary h-auto p-2"
                disabled={isCreating || isSaving}
              >
                <Save className="w-3.5 h-3.5 mr-2" /> Save Draft
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem]">
              <AlertDialogHeader>
                <AlertDialogTitle>Save Draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  We'll keep this design in the Lab. You can return to it anytime from the dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Continue Review</AlertDialogCancel>
                <AlertDialogAction onClick={onSaveAndFinishLater} className="rounded-xl">
                  Save and Exit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="font-black uppercase text-[10px] tracking-[0.2em] hover:text-destructive h-auto p-2"
              disabled={isCreating || isSaving}
            >
              <X className="w-3.5 h-3.5 mr-2" /> Discard
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive font-black uppercase">Discard Design?</AlertDialogTitle>
              <AlertDialogDescription className="font-medium text-base">
                This will permanently wipe this habit design. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel className="rounded-xl">Keep Reviewing</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDiscardDraft(wizardData.habit_key || '')}
                className="rounded-xl bg-destructive hover:bg-destructive/90"
              >
                Wipe Design
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};