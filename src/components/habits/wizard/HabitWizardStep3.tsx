"use client";

import React, { useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Info, Zap, Calendar, Heart } from 'lucide-react';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { cn } from '@/lib/utils';

interface HabitWizardStep3Props {
  wizardData: Partial<WizardHabitData>;
  setWizardData: React.Dispatch<React.SetStateAction<Partial<WizardHabitData>>>;
}

export const HabitWizardStep3: React.FC<HabitWizardStep3Props> = ({ wizardData, setWizardData }) => {
  // This component is deprecated in the micro-step flow but kept for compatibility.
  // It now maps to the new granular fields if used, or relies on defaults.
  // Since the new flow uses micro-steps, this component is effectively unused 
  // unless the user skips the micro-steps or loads old data.
  // We will map the old fields to the new ones for safety.

  const suggestedDailyGoal = useMemo(() => {
    // Map old fields to new ones if they exist, otherwise default
    const energy = wizardData.energy_per_session || 'moderate';
    let duration = 15;
    if (energy === 'very_little') duration = 5;
    if (energy === 'a_bit') duration = 10;
    if (energy === 'moderate') duration = 20;
    if (energy === 'plenty') duration = 30;
    
    const frequency = wizardData.consistency_reality === 'daily' ? 7 : 
                      wizardData.consistency_reality === 'most_days' ? 5 : 3;
    
    return duration;
  }, [wizardData.energy_per_session, wizardData.consistency_reality]);

  // Auto-update derived fields
  useEffect(() => {
    // If we have granular data, update the summary fields
    if (wizardData.energy_per_session || wizardData.consistency_reality || wizardData.confidence_check) {
      const calculatedParams = {
        daily_goal: suggestedDailyGoal,
        frequency_per_week: wizardData.consistency_reality === 'daily' ? 7 : 
                            wizardData.consistency_reality === 'most_days' ? 5 : 
                            wizardData.consistency_reality === '1-2_days' ? 2 : 3,
      };
      
      setWizardData(prev => ({
        ...prev,
        daily_goal: calculatedParams.daily_goal,
        frequency_per_week: calculatedParams.frequency_per_week,
      }));
    }
  }, [wizardData.energy_per_session, wizardData.consistency_reality, wizardData.confidence_check, suggestedDailyGoal, setWizardData]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-primary" />
        <dyad-problem-report summary="6 problems">
<problem file="src/components/dashboard/FooterStats.tsx" line="24" column="8" code="17008">JSX element 'div' has no corresponding closing tag.</problem>
<problem file="src/components/dashboard/QuickLogButton.tsx" line="1" column="15" code="1005">'from' expected.</problem>
<problem file="src/components/habits/wizard/HabitTemplateForm.tsx" line="104" column="19" code="17002">Expected corresponding JSX closing tag for 'SelectTrigger'.</problem>
<problem file="src/components/habits/wizard/HabitTemplateForm.tsx" line="122" column="19" code="17002">Expected corresponding JSX closing tag for 'SelectTrigger'.</problem>
<problem file="src/pages/Settings.tsx" line="70" column="5" code="2552">Cannot find name 'onUpdateHabitField'. Did you mean 'updateHabitField'?</problem>
<problem file="src/pages/HabitWizard.tsx" line="26" column="27" code="2724">'&quot;@/types/habit&quot;' has no exported member named 'HabitCategoryType'. Did you mean 'HabitCategory'?</problem>
</dyad-problem-report><think>**Analyzing Compile Errors**

I've begun examining the reported TypeScript compile errors. The first one, a missing closing tag in `FooterStats.tsx`, seems straightforward, and I'll address it immediately to eliminate that particular issue from the list. I'm moving methodically through these issues to ensure a clean compilation.


**Resolving TypeScript Issues**

I'm systematically tackling the six TypeScript compile errors. The missing closing tag in `FooterStats.tsx` is fixed by adding `</div>`. The import syntax error in `QuickLogButton.tsx` is corrected by including the `from` keyword. The `SelectTrigger` closing tag is added, resolving a similar issue in `HabitTemplateForm.tsx`. I'm now proceeding through the remaining errors, focusing on resolving each reported problem, ensuring clean code with a focus on quick solutions.


**Implementing Code Changes**

Now, I'm integrating the proposed changes. The `FooterStats.tsx` closing `</div>` is in place. I've corrected the import statement in `QuickLogButton.tsx` to include `from`. Both instances of the missing `SelectTrigger` closing tags in `HabitTemplateForm.tsx` have been addressed. The function call `onUpdateHabitField` has been updated to `updateHabitField` in `Settings.tsx`, resolving the typo. Finally, the import in `HabitWizard.tsx` now correctly references `HabitCategory` from the types file. The code should now compile without errors.


**Implementing Error Fixes**

I'm now methodically applying the proposed changes to the code. The `FooterStats.tsx` issue with the missing `div` closing tag is fixed with the addition. The import in `QuickLogButton.tsx` now correctly includes the `from` keyword. I've corrected the `SelectTrigger` closing tag issues in `HabitTemplateForm.tsx`. The typo, `onUpdateHabitField` has been updated to `updateHabitField` in `Settings.tsx`, resolving the function call error. Lastly, the import in `HabitWizard.tsx` now correctly references `HabitCategory` from the types file. Hopefully, these modifications will eliminate all compile-time errors.


</think>I've reviewed the TypeScript errors you're encountering. It looks like a mix of JSX syntax issues, a missing `from` keyword in an import, and a couple of naming inconsistencies. I'll fix these for you right away.

Here are the changes I'll make:

1.  **`src/components/dashboard/FooterStats.tsx`**: Add the missing closing `</div>` tag.
2.  **`src/components/dashboard/QuickLogButton.tsx`**: Correct the import statement by adding the `from` keyword.
3.  **`src/components/habits/wizard/HabitTemplateForm.tsx`**: Correct the structure of the `SelectTrigger` and `SelectValue` components in two places.
4.  **`src/pages/Settings.tsx`**: Correct the function call from `onUpdateHabitField` to `updateHabitField`.
5.  **`src/pages/HabitWizard.tsx`**: Update the import to use `HabitCategory` instead of `HabitCategoryType`.

Here are the updated files:

<dyad-write path="src/components/dashboard/FooterStats.tsx" description="Adding missing closing div tag.">
import { Button } from '@/components/ui/button';
import { BarChart, Zap, Calendar, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FooterStatsProps {
  streak: number;
  daysActive: number;
  totalPushups: number;
  totalMeditation: number;
  averageDailyTasks: string;
}

export const FooterStats: React.FC<FooterStatsProps> = ({ 
  streak, 
  daysActive, 
  totalPushups, 
  totalMeditation, 
  averageDailyTasks 
}) => (
  <Card className="rounded-2xl shadow-sm border-0 mt-2">
    <CardContent className="p-6">
      <div className="text-center space-y-6">
        <p className="text-muted-foreground italic">
          "You're not behind. You're exactly where you need to be."
        </p>
        
        <div className="flex justify-center">
          <Link to="/history">
            <Button variant="outline" className="rounded-full px-6 py-3 h-auto text-base font-semibold">
              <BarChart className="w-5 h-5 mr-2" />
              View History
            </Button>
          </Link>
        </div>
        
        <div className="border-t w-full pt-6">
          <div className="flex justify-center space-x-10 text-muted-foreground">
            <div className="text-center">
              <p className="font-bold text-xl text-foreground flex items-center justify-center">
                <Zap className="w-4 h-4 mr-1 text-warning" />
                {streak}
              </p>
              <p className="text-xs">streak</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-foreground">{averageDailyTasks}</p>
              <p className="text-xs">avg tasks/day</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-foreground flex items-center justify-center">
                <Calendar className="w-4 h-4 mr-1 text-info" />
                {daysActive}
              </p>
              <p className="text-xs">days active</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-12">
          <div>
            <p className="text-3xl font-bold">{totalPushups}</p>
            <p className="text-sm text-muted-foreground">TOTAL PUSH-UPS</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{Math.round(totalMeditation)}m</p>
            <p className="text-sm text-muted-foreground">TOTAL MEDITATION</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);