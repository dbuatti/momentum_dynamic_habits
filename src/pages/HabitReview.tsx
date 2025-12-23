"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { StructuredOverview } from '@/components/habits/wizard/review/StructuredOverview'; // Corrected import path
import { NarrativeSummary } from '@/components/habits/wizard/review/NarrativeSummary'; // Corrected import path
import { CheckCircle2, Edit2, Save, X, Target } from 'lucide-react';
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

interface HabitReviewStepProps {
  wizardData: Partial<WizardHabitData>;
  onEditDetails: () => void;
  onSaveAndFinishLater: () => Promise<void>;
  onCreateHabit: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  isCreating: boolean;
}

export const HabitReviewStep: React.FC<HabitReviewStepProps> = ({
  wizardData,
  onEditDetails,
  onSaveAndFinishLater,
  onCreateHabit,
  onCancel,
  isSaving,
  isCreating,
}) => {
  const [reviewMode, setReviewMode] = useState<'structured' | 'narrative'>('narrative');
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const isFormValid = useMemo(() => {
    return wizardData.name?.trim() && wizardData.habit_key?.trim() && wizardData.category;
  }, [wizardData]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Review Your Habit</h2>
        <p className="text-muted-foreground">
          Here's what we've created together. You can view it as structured data or as a story.
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <SegmentedControl
          options={[
            { label: 'Structured Overview', value: 'structured' },
            { label: 'Narrative Summary', value: 'narrative' },
          ]}
          value={reviewMode}
          onValueChange={(value) => setReviewMode(value as 'structured' | 'narrative')}
        />
      </div>

      {reviewMode === 'structured' ? (
        <StructuredOverview wizardData={wizardData} />
      ) : (
        <NarrativeSummary wizardData={wizardData} neurodivergentMode={neurodivergentMode} />
      )}

      <div className="flex flex-col gap-4 pt-8 border-t border-border">
        <Button
          type="button"
          className="w-full h-14 rounded-2xl text-lg font-bold"
          onClick={onCreateHabit}
          disabled={isCreating || isSaving || !isFormValid}
        >
          <CheckCircle2 className="w-6 h-6 mr-2" />
          Create Habit
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-2xl font-semibold"
          onClick={onEditDetails}
          disabled={isCreating || isSaving}
        >
          <Edit2 className="w-5 h-5 mr-2" />
          Edit Details
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-12 rounded-2xl font-semibold text-muted-foreground hover:text-primary"
              disabled={isCreating || isSaving}
            >
              <Save className="w-5 h-5 mr-2" />
              Save & Finish Later
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Save Progress?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current habit wizard progress will be saved, and you can continue later from the dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onSaveAndFinishLater} className="rounded-xl">
                Save Progress
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-12 rounded-2xl font-semibold text-destructive hover:bg-destructive/10"
              disabled={isCreating || isSaving}
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will discard all your current progress in the habit wizard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Keep Editing</AlertDialogCancel>
              <AlertDialogAction onClick={onCancel} className="rounded-xl bg-destructive hover:bg-destructive/90">
                Discard Progress
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};