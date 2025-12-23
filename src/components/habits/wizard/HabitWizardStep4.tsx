"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Zap, 
  Heart, 
  Calendar, 
  AlertCircle, 
  Target,
  CheckCircle2
} from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface HabitWizardStep4Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

// Barrier categories with specific options
const barrierCategories = [
  {
    id: 'memory',
    title: 'Memory & Attention',
    question: 'What usually stops you from remembering to do this?',
    icon: Brain,
    options: [
      { id: 'forget', label: 'I forget it exists' },
      { id: 'lose_track', label: 'I lose track of time' },
      { id: 'distracted', label: 'I get distracted mid-task' },
      { id: 'remember_late', label: 'I remember... but too late' },
      { id: 'no_memory_issue', label: "This isn't a memory issue" },
    ],
  },
  {
    id: 'energy',
    title: 'Energy & Overwhelm',
    question: 'When this habit feels hard, what’s usually going on?',
    icon: Zap,
    options: [
      { id: 'mental_drain', label: 'I feel mentally drained' },
      { id: 'physical_tired', label: 'I feel physically tired' },
      { id: 'start_overwhelm', label: 'Starting feels overwhelming' },
      { id: 'too_big', label: 'I avoid it because it feels "too big"' },
      { id: 'no_energy_issue', label: "Energy isn't the issue" },
    ],
  },
  {
    id: 'emotional',
    title: 'Emotional Resistance',
    question: 'Does this habit bring up any emotional resistance?',
    icon: Heart,
    options: [
      { id: 'fear_wrong', label: 'Fear of doing it "wrong"' },
      { id: 'perfectionism', label: 'Perfectionism / pressure' },
      { id: 'guilt', label: 'Guilt when I miss days' },
      { id: 'shame', label: 'Shame around consistency' },
      { id: 'no_emotional_issue', label: 'No emotional resistance' },
    ],
  },
  {
    id: 'context',
    title: 'Contextual Friction',
    question: 'What external things get in the way?',
    icon: Calendar,
    options: [
      { id: 'schedule_changes', label: 'My schedule changes a lot' },
      { id: 'interruptions', label: 'Other people interrupt me' },
      { id: 'no_setup', label: "I don't have the right setup/tools" },
      { id: 'depends_on_others', label: 'This depends on another task' },
      { id: 'no_context_issue', label: 'No major external blockers' },
    ],
  },
];

export const HabitWizardStep4: React.FC<HabitWizardStep4Props> = ({ wizardData, setWizardData }) => {
  // Initialize barriers object if it doesn't exist
  React.useEffect(() => {
    if (!wizardData.barriers) {
      setWizardData(prev => ({ ...prev, barriers: [] }));
    }
  }, []);

  // Handle barrier selection (multi-select)
  const toggleBarrier = (barrierId: string) => {
    setWizardData(prev => {
      const currentBarriers = prev.barriers || [];
      const newBarriers = currentBarriers.includes(barrierId)
        ? currentBarriers.filter(id => id !== barrierId)
        : [...currentBarriers, barrierId];
      return { ...prev, barriers: newBarriers };
    });
  };

  // Calculate system effects based on selected barriers
  const systemEffects = React.useMemo(() => {
    const barriers = wizardData.barriers || [];
    const effects: string[] = [];

    // Memory issues
    if (barriers.some(b => ['forget', 'lose_track', 'distracted', 'remember_late'].includes(b))) {
      effects.push('Earlier surfacing on dashboard');
      effects.push('Time-window nudges');
      effects.push('Anchor Practice suggestion');
    }

    // Energy/Overwhelm issues
    if (barriers.some(b => ['mental_drain', 'physical_tired', 'start_overwhelm', 'too_big'].includes(b))) {
      effects.push('Auto-chunking enabled');
      effects.push('Smaller capsule sizes');
      effects.push('Trial Mode bias');
    }

    // Emotional resistance
    if (barriers.some(b => ['fear_wrong', 'perfectionism', 'guilt', 'shame'].includes(b))) {
      effects.push('No streak pressure');
      effects.push('Delayed Adaptive Growth');
      effects.push('Trial Mode enforcement');
    }

    // Contextual friction
    if (barriers.some(b => ['schedule_changes', 'interruptions', 'no_setup', 'depends_on_others'].includes(b))) {
      effects.push('Wider time windows');
      effects.push('Carryover logic enabled');
      effects.push('Dependency logic suggestion');
    }

    return effects;
  }, [wizardData.barriers]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Let's make this habit doable in real life</h2>
        <p className="text-muted-foreground">What tends to get in the way — so we can design around it?</p>
      </div>

      {barrierCategories.map((category) => (
        <Card key={category.id} className="border-border">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <category.icon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">{category.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{category.question}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {category.options.map((option) => {
                const isSelected = wizardData.barriers?.includes(option.id);
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 justify-start gap-2 text-sm",
                      isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    )}
                    onClick={() => toggleBarrier(option.id)}
                  >
                    {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-30" />}
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* System Effects Preview */}
      {systemEffects.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-primary">How we'll adapt for you</h3>
            </div>
            <ul className="space-y-1 text-sm text-primary/80">
              {systemEffects.map((effect, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground italic text-center">
          "None of this is a problem — it just helps us build something that actually fits your life."
        </p>
      </div>
    </div>
  );
};