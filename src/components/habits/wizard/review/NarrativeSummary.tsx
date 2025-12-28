"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { cn } from '@/lib/utils';
import { Anchor, FlaskConical, Zap, ShieldCheck, Clock, Link, TrendingUp, Smile, Frown, Info, Layers, ListChecks, CalendarCheck } from 'lucide-react';
import { useJourneyData } from '@/hooks/useJourneyData';

interface NarrativeSummaryProps {
  wizardData: Partial<WizardHabitData>;
  neurodivergentMode: boolean;
}

export const NarrativeSummary: React.FC<NarrativeSummaryProps> = ({ wizardData, neurodivergentMode }) => {
  const { data: journeyData } = useJourneyData();
  const allHabits = journeyData?.allHabits || [];

  const getDependentHabitName = (id?: string | null) => {
    if (!id) return 'another habit'; 
    return allHabits.find(h => h.id === id)?.name || 'a previous habit';
  };

  const renderSection = (IconComponent: React.ElementType, title: string, content: React.ReactNode) => (
    <Card className="border-border shadow-sm rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <IconComponent className="w-5 h-5" /> 
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          {content}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Here's what we've created together.</h2>
      <p className="text-muted-foreground text-center">
        Take a moment to review your habit, explained in a way that makes sense to you.
      </p>

      {renderSection(
        Info,
        "Your New Habit",
        <>
          <p>
            Your new habit is <strong className="text-primary">{wizardData.name || 'your new practice'}</strong>.
            It's categorized under <strong className="text-primary">{wizardData.category || 'daily tasks'}</strong>,
            and we'll track your progress in <strong className="text-primary">{wizardData.unit || 'minutes'}</strong>.
          </p>
          {wizardData.short_description && (
            <p>
              This habit is designed to <strong className="text-primary">{wizardData.short_description.toLowerCase()}</strong>.
            </p>
          )}
        </>
      )}

      {renderSection(
        Clock,
        "Your Goals & Schedule",
        <>
          <p>
            The system has suggested a daily goal of <strong className="text-primary">{wizardData.daily_goal || 'N/A'} {wizardData.unit || ''}</strong>,
            to be completed <strong className="text-primary">{wizardData.frequency_per_week || 'N/A'} times per week</strong>.
          </p>
          {wizardData.is_weekly_goal ? (
            <p className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
              This is a <strong className="text-primary">Weekly Objective</strong>. It will stay visible on your dashboard until you hit your weekly sessions, giving you full flexibility on which days you practice.
            </p>
          ) : wizardData.window_start && wizardData.window_end ? (
            <p>
              We've set a specific time window for this habit: <strong className="text-primary">{wizardData.window_start} - {wizardData.window_end}</strong>.
            </p>
          ) : (
            <p>
              We've left the time window as <strong className="text-primary">flexible (anytime)</strong>, giving you autonomy over your schedule.
            </p>
          )}
          
          <p className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary shrink-0" />
            Completion behavior: <strong className="text-primary">{wizardData.complete_on_finish ? "Mark done on finish" : "Save actual time/reps"}</strong>. 
            {wizardData.complete_on_finish 
              ? " Stopping a session will count the whole goal as reached."
              : " Stopping will only credit you for the progress you actually made."}
          </p>
        </>
      )}

      {renderSection(
        TrendingUp,
        "How Your Habit Will Grow",
        <>
          {wizardData.is_fixed ? (
            <p>
              This habit is set to <strong className="text-primary">Fixed (Maintenance) Mode</strong>. Its goal will remain stable over time.
            </p>
          ) : wizardData.is_trial_mode ? (
            <p>
              This habit is starting in <strong className="text-primary">Trial Phase</strong>. We'll focus purely on consistency for <strong className="text-primary">{wizardData.plateau_days_required} days</strong> before suggesting any growth.
            </p>
          ) : (
            <p>
              This habit is in <strong className="text-primary">Adaptive Growth Mode</strong>. Consistency will lead to small, manageable increases in your goals.
            </p>
          )}

          {wizardData.anchor_practice && (
            <p className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-primary shrink-0" />
              This is an <strong className="text-primary">Anchor Practice</strong>. It will be prioritized to keep you grounded.
            </p>
          )}

          {wizardData.auto_chunking && (
            <p className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <strong className="text-primary">Auto-Chunking is enabled</strong> to break sessions into smaller capsules and reduce overwhelm.
            </p>
          )}

          {wizardData.dependent_on_habit_id && (
            <p className="flex items-center gap-2">
              <Link className="w-4 h-4 text-primary shrink-0" />
              This habit will <strong className="text-primary">unlock after {getDependentHabitName(wizardData.dependent_on_habit_id)}</strong> is finished for the day.
            </p>
          )}

          {wizardData.carryover_enabled && (
            <p className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <strong className="text-primary">Carryover is enabled</strong> to provide a gentle safety net for unused progress.
            </p>
          )}
        </>
      )}

      {renderSection(
        Smile,
        "Your Personalized Support",
        <>
          {neurodivergentMode && (
            <p>
              With <strong className="text-primary">Neurodivergent Mode</strong> active, you'll benefit from smaller increments and longer stabilization plateaus.
            </p>
          )}
          {wizardData.emotional_cost === 'heavy' && (
            <p className="flex items-center gap-2">
              <Frown className="w-4 h-4 text-destructive shrink-0" />
              Since this can feel <strong className="text-destructive">heavy to start</strong>, we'll keep the pressure low.
            </p>
          )}
          <p className="text-sm font-bold text-primary mt-4">
            ✨ This habit is designed to support you — not control you.
          </p>
        </>
      )}
    </div>
  );
};