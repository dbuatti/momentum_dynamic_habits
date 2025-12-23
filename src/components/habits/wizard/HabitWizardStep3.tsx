"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, Calendar, AlertCircle, Heart, Target } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface HabitWizardStep3Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

const barrierOptions = [
  { id: 'forgetting', label: 'Forgetting', icon: AlertCircle },
  { id: 'motivation', label: 'Low Motivation', icon: Heart },
  { id: 'time', label: 'Time Constraints', icon: Calendar },
  { id: 'energy', label: 'Mental Fatigue', icon: Zap },
];

export const HabitWizardStep3: React.FC<HabitWizardStep3Props> = ({ wizardData, setWizardData }) => {
  // Calculate dynamic suggestions based on inputs
  const suggestedDailyGoal = React.useMemo(() => {
    const duration = wizardData.session_duration || 10;
    const frequency = wizardData.weekly_frequency || 3;
    // Simple heuristic: Daily goal is duration, adjusted slightly by frequency
    // We'll keep daily goal separate from frequency in the final data
    return duration;
  }, [wizardData.session_duration, wizardData.weekly_frequency]);

  // Auto-update logic for Trial vs Growth mode
  React.useEffect(() => {
    const confidence = wizardData.confidence_level || 5;
    const barriersCount = wizardData.barriers?.length || 0;
    
    // If low confidence or many barriers, suggest Trial Mode
    const shouldStartInTrial = confidence < 4 || barriersCount >= 2;
    
    setWizardData(prev => ({
      ...prev,
      is_trial_mode: shouldStartInTrial,
      // Pre-fill daily goal and frequency if not set
      daily_goal: prev.daily_goal || suggestedDailyGoal,
      frequency_per_week: prev.weekly_frequency || 3,
    }));
  }, [wizardData.session_duration, wizardData.weekly_frequency, wizardData.confidence_level, wizardData.barriers, suggestedDailyGoal, setWizardData]);

  const toggleBarrier = (barrierId: string) => {
    setWizardData(prev => {
      const currentBarriers = prev.barriers || [];
      const newBarriers = currentBarriers.includes(barrierId)
        ? currentBarriers.filter(id => id !== barrierId)
        : [...currentBarriers, barrierId];
      return { ...prev, barriers: newBarriers };
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">What's your realistic capacity?</h2>
        <p className="text-muted-foreground">Let's set goals that actually fit your life.</p>
      </div>

      {/* 1. Energy Availability (Session Duration) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <Label className="font-bold">Session Duration (Minutes)</Label>
          </div>
          <Slider
            min={5}
            max={60}
            step={5}
            value={[wizardData.session_duration || 10]}
            onValueChange={(val) => setWizardData(prev => ({ ...prev, session_duration: val[0] }))}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>5 min</span>
            <span className="font-bold text-primary">{wizardData.session_duration || 10} min</span>
            <span>60 min</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Frequency Comfort */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <Label className="font-bold">Weekly Frequency</Label>
          </div>
          <Slider
            min={1}
            max={7}
            step={1}
            value={[wizardData.weekly_frequency || 3]}
            onValueChange={(val) => setWizardData(prev => ({ ...prev, weekly_frequency: val[0] }))}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1x</span>
            <span className="font-bold text-primary">{wizardData.weekly_frequency || 3}x / week</span>
            <span>7x</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Barriers */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <Label className="font-bold">What might make this difficult?</Label>
          <div className="grid grid-cols-2 gap-2">
            {barrierOptions.map((barrier) => {
              const isSelected = wizardData.barriers?.includes(barrier.id);
              const Icon = barrier.icon;
              return (
                <Button
                  key={barrier.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-12 justify-start gap-2",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => toggleBarrier(barrier.id)}
                >
                  <Icon className="w-4 h-4" />
                  {barrier.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Confidence (Self-Efficacy) */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <Label className="font-bold">How confident are you?</Label>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[wizardData.confidence_level || 5]}
            onValueChange={(val) => setWizardData(prev => ({ ...prev, confidence_level: val[0] }))}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Low</span>
            <span className="font-bold text-primary">{wizardData.confidence_level || 5}/10</span>
            <span>High</span>
          </div>
        </CardContent>
      </Card>

      {/* Summary / Auto-Generated Settings */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-bold text-foreground">Based on your answers:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Daily Goal: <span className="font-semibold text-primary">{wizardData.session_duration || 10} min</span></li>
            <li>• Weekly Frequency: <span className="font-semibold text-primary">{wizardData.weekly_frequency || 3} days</span></li>
            <li>• Starting Mode: <span className="font-semibold text-primary">{wizardData.is_trial_mode ? 'Trial Phase (Low Pressure)' : 'Adaptive Growth'}</span></li>
            {wizardData.barriers && wizardData.barriers.length > 0 && (
              <li>• Auto-Chunking: <span className="font-semibold text-primary">Enabled (to reduce overwhelm)</span></li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};