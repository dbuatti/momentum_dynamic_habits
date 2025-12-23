"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Target, 
  Zap, 
  Heart, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2,
  AlertCircle,
  Star
} from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

interface HabitWizardStep6Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const HabitWizardStep6: React.FC<HabitWizardStep6Props> = ({ wizardData, setWizardData }) => {
  
  // Helper to update nested confidence object
  const updateConfidence = (key: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      confidence: {
        ...(prev.confidence || {}),
        [key]: value,
      } as WizardHabitData['confidence']
    }));
  };

  // Helper to handle multi-select arrays
  const toggleArrayValue = (key: string, value: string) => {
    setWizardData(prev => {
      const currentArray = (prev.confidence as any)?.[key] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item: string) => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        confidence: {
          ...(prev.confidence || {}),
          [key]: newArray,
        } as WizardHabitData['confidence']
      };
    });
  };

  // Calculate summary based on current data
  const getSummary = () => {
    const c = wizardData.confidence || {};
    const lines: string[] = [];

    // Growth Pressure
    if (c.growth_appetite === 'fixed') lines.push("• Starts gently, no growth pressure");
    else if (c.growth_appetite === 'suggested') lines.push("• Suggests growth gently (you can say no)");
    else if (c.growth_appetite === 'auto') lines.push("• Automatically grows when ready");

    // Timing (from previous steps)
    if (wizardData.timing_preference && wizardData.timing_preference !== 'anytime') {
      lines.push(`• Lives in the ${wizardData.timing_preference} with flexibility`);
    } else {
      lines.push("• Flexible timing, no strict windows");
    }

    // Dependencies
    if (wizardData.dependent_on_habit_id) {
      lines.push(`• Unlocks after prerequisite habit`);
    }

    // Growth Style
    if (c.growth_style && c.growth_style.length > 0) {
      const style = c.growth_style[0]; // Take first priority
      const styleText = style === 'frequency' ? 'more days' : style === 'duration' ? 'longer sessions' : 'balanced growth';
      lines.push(`• Grows by ${styleText} once it feels easy`);
    }

    // Failure Protection
    if (c.failure_protection && c.failure_protection.length > 0) {
      if (c.failure_protection.includes('pause')) lines.push("• Pauses growth if life gets chaotic");
      if (c.failure_protection.includes('reduce')) lines.push("• Temporarily reduces goals if needed");
      if (c.failure_protection.includes('pressure')) lines.push("• Removes pressure, keeps goals visible");
    }

    return lines;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">How this habit grows — without burning you out</h2>
        <p className="text-muted-foreground">Let's set safe guardrails for the long term.</p>
      </div>

      {/* Section 1: Confidence Baseline */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">How confident do you feel about keeping this habit going?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'low', label: 'Not very confident', icon: '🌱' },
              { id: 'medium', label: 'Somewhat confident', icon: '🌿' },
              { id: 'high', label: 'Very confident', icon: '🌳' },
            ].map((option) => {
              const isSelected = wizardData.confidence?.baseline === option.id;
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => updateConfidence('baseline', option.id)}
                >
                  <span className="text-lg">{option.icon}</span>
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Growth Appetite */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">When this habit starts to feel easy, what do you want to happen?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'fixed', label: 'Keep it exactly as it is' },
              { id: 'suggested', label: 'Gently suggest more (I can say no)' },
              { id: 'auto', label: 'Automatically grow it for me' },
            ].map((option) => {
              const isSelected = wizardData.confidence?.growth_appetite === option.id;
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => updateConfidence('growth_appetite', option.id)}
                >
                  <div className={cn("w-4 h-4 rounded-full border border-current", isSelected ? "bg-white" : "opacity-30")} />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Growth Style Preference */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">How should this habit grow?</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Select your preference (system will prioritize the first).</p>
          
          <div className="space-y-2">
            {[
              { id: 'frequency', label: 'More days per week' },
              { id: 'duration', label: 'Longer sessions' },
              { id: 'hybrid', label: 'Alternate between both' },
              { id: 'flexible', label: 'I don’t care — choose what’s easier' },
            ].map((option) => {
              const isSelected = wizardData.confidence?.growth_style?.includes(option.id);
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => toggleArrayValue('growth_style', option.id)}
                >
                  {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-30" />}
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Failure Protection */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">If you fall off this habit, what would help you most?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'pause', label: 'Pause growth automatically' },
              { id: 'reduce', label: 'Reduce goals temporarily' },
              { id: 'pressure', label: 'Keep goals but remove pressure' },
              { id: 'ask', label: 'Ask me before changing anything' },
            ].map((option) => {
              const isSelected = wizardData.confidence?.failure_protection?.includes(option.id);
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => toggleArrayValue('failure_protection', option.id)}
                >
                  {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-30" />}
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Self-Trust Check */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">What usually causes you to abandon habits?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'overwhelm', label: 'I try to do too much' },
              { id: 'shame', label: 'I miss one day and give up' },
              { id: 'chaos', label: 'Life gets unpredictable' },
              { id: 'purpose', label: 'I forget why I started' },
              { id: 'interest', label: 'Nothing — I just lose interest' },
            ].map((option) => {
              const isSelected = wizardData.confidence?.abandon_reasons?.includes(option.id);
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => toggleArrayValue('abandon_reasons', option.id)}
                >
                  {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-30" />}
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Success Definition */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">What does success look like for this habit right now?</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { id: 'sometimes', label: 'Showing up sometimes' },
              { id: 'mostly', label: 'Doing it most weeks' },
              { id: 'automatic', label: 'Making it automatic' },
              { id: 'unknown', label: 'I don’t know yet' },
            ].map((option) => {
              const isSelected = wizardData.confidence?.success_definition === option.id;
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                  onClick={() => updateConfidence('success_definition', option.id)}
                >
                  <div className={cn("w-4 h-4 rounded-full border border-current", isSelected ? "bg-white" : "opacity-30")} />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Screen */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-primary">Here’s how this habit will behave:</h3>
          </div>
          <ul className="space-y-1 text-sm text-primary/80">
            {getSummary().length > 0 ? (
              getSummary().map((line, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{line}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Select options above to see your habit's behavior summary.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground italic text-center">
          "This habit doesn't need willpower. It needs a system that understands you."
        </p>
      </div>
    </div>
  );
};