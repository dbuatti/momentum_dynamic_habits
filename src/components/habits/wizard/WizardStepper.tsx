"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WizardStepperProps {
  currentMacroStep: number;
  totalMacroSteps: number;
  onStepClick: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  stepLabels: string[];
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentMacroStep,
  totalMacroSteps,
  onStepClick,
  isStepCompleted,
  stepLabels,
}) => {
  return (
    <div className="flex justify-between items-center gap-2">
      {Array.from({ length: totalMacroSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentMacroStep;
        const isCompleted = isStepCompleted(stepNumber);
        // All steps are now clickable
        const isClickable = true; 

        return (
          <Button
            key={stepNumber}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200",
              "flex items-center justify-center gap-1",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : isCompleted
                  ? "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  : "text-muted-foreground opacity-60 hover:bg-secondary/50", // Styling for future steps
            )}
            onClick={() => onStepClick(stepNumber)}
            // No longer disabling based on isClickable, as all are clickable
          >
            {isCompleted && !isActive ? (
              <Check className="w-3 h-3" />
            ) : (
              <span className="w-3 h-3 flex items-center justify-center">{stepNumber}</span>
            )}
            <span className="hidden sm:inline">{stepLabels[index]}</span>
          </Button>
        );
      })}
    </div>
  );
};