"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { cn } from '@/lib/utils';
import { Anchor, FlaskConical, Zap, ShieldCheck, Clock, Link, TrendingUp, Smile, Frown, Info, Layers } from 'lucide-react';
import { useJourneyData } from '@/hooks/useJourneyData';

interface NarrativeSummaryProps {
  wizardData: Partial<WizardHabitData>;
  neurodivergentMode: boolean;
}

export const NarrativeSummary: React.FC<NarrativeSummaryProps> = ({ wizardData, neurodivergentMode }) => {
  const { data: journeyData } = useJourneyData();
  const allHabits = journeyData?.allHabits || [];

  const getDependentHabitName = (id?: string | null) => {
    if (!id) return 'another habit'; // Fallback for narrative
    return allHabits.find(h => h.id === id)?.name || 'a previous habit';
  };

  // Modified renderSection to accept React.ElementType directly
  const renderSection = (IconComponent: React.ElementType, title: string, content: React.ReactNode) => (
    <Card className="border-border shadow-sm rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <IconComponent className="w-5 h-5" /> {/* Render IconComponent directly */}
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
            This reflects the capacity you shared — enough to build momentum, without asking too much on low-energy days.
          </p>
          {wizardData.window_start && wizardData.window_end ? (
            <p>
              We've set a specific time window for this habit: <strong className="text-primary">{wizardData.window_start} - {wizardData.window_end}</strong>.
              This helps the app suggest it when you're most likely to succeed.
            </p>
          ) : (
            <p>
              We've left the time window as <strong className="text-primary">flexible (anytime)</strong>, so you’re not boxed into a specific part of the day.
              This gives you autonomy and reduces friction.
            </p>
          )}
        </>
      )}

      {renderSection(
        TrendingUp,
        "How Your Habit Will Grow",
        <>
          {wizardData.is_fixed ? (
            <p>
              This habit is set to <strong className="text-primary">Fixed (Maintenance) Mode</strong>. This means its goal will remain stable,
              as it's designed for consistent maintenance rather than growth.
            </p>
          ) : wizardData.is_trial_mode ? (
            <p>
              This habit is starting in <strong className="text-primary">Trial Phase</strong>. The focus is purely on showing up consistently,
              not on increasing intensity or duration. We'll track your consistency for <strong className="text-primary">{wizardData.plateau_days_required} days</strong>
              to ensure the habit feels routine before suggesting growth.
            </p>
          ) : (
            <p>
              This habit is in <strong className="text-primary">Adaptive Growth Mode</strong>. If you complete it consistently for <strong className="text-primary">{wizardData.plateau_days_required} days</strong>,
              the system may suggest a small increase in its goal or frequency. You’ll always be able to say yes or no.
            </p>
          )}

          {wizardData.anchor_practice && (
            <p className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-primary shrink-0" />
              This is an <strong className="text-primary">Anchor Practice</strong>. It will be prioritized on your dashboard to help keep you grounded and consistent.
            </p>
          )}

          {wizardData.auto_chunking && (
            <p className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <strong className="text-primary">Auto-Chunking is enabled</strong>. Longer sessions will be automatically broken into smaller, more manageable "capsules" to reduce overwhelm.
            </p>
          )}

          {wizardData.dependent_on_habit_id && (
            <p className="flex items-center gap-2">
              <Link className="w-4 h-4 text-primary shrink-0" />
              This habit will <strong className="text-primary">unlock after {getDependentHabitName(wizardData.dependent_on_habit_id)} is completed</strong> on the same day.
              This isn’t a restriction — it’s a gentle nudge to protect your energy and prioritize what matters most.
            </p>
          )}

          {wizardData.carryover_enabled && (
            <p className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <strong className="text-primary">Carryover is enabled</strong>. If you don't complete the full goal today, unused time/reps can roll over to tomorrow, giving you a gentle safety net.
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
              With <strong className="text-primary">Neurodivergent Mode</strong> active, the system will offer smaller increments, longer stabilization plateaus,
              and modular task capsules to reduce overwhelm and support consistent engagement.
            </p>
          )}
          {wizardData.emotional_cost === 'heavy' && (
            <p className="flex items-center gap-2">
              <Frown className="w-4 h-4 text-destructive shrink-0" />
              Because this habit can feel <strong className="text-destructive">heavy or draining to start</strong>, we've prioritized a low-pressure approach to help you build consistency without burnout.
            </p>
          )}
          {wizardData.missed_day_response === 'stop_completely' && (
            <p>
              You mentioned that missing a day can lead to stopping completely. The system will provide <strong className="text-primary">gentle nudges and flexible options</strong> to help you get back on track without guilt.
            </p>
          )}
          {wizardData.sensitivity_setting === 'gentle' && (
            <p>
              The app will use <strong className="text-primary">gentle language and soft reminders</strong> when things go off track, respecting your need for a supportive environment.
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