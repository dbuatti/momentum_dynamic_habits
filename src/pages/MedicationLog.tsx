import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Pill } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

const MedicationLog = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const { mutate: logHabit, isPending } = useHabitLog();

  // Check if already completed today
  useEffect(() => {
    const checkCompletion = () => {
      const today = new Date().toDateString();
      const lastCompleted = localStorage.getItem('medicationLastCompleted');
      if (lastCompleted === today) {
        setIsCompleted(true);
      }
    };
    checkCompletion();
  }, []);

  const handleMarkDone = () => {
    logHabit({
      habitKey: 'medication',
      value: 1,
      taskName: 'Take Medication'
    });
    
    // Mark as completed for today
    const today = new Date().toDateString();
    localStorage.setItem('medicationLastCompleted', today);
    setIsCompleted(true);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title="Take Medication" backLink="/" />
        <Card className="rounded-2xl shadow-lg border-4 border-purple-200 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center">
              <div className="bg-purple-50 rounded-full w-24 h-24 flex items-center justify-center mb-6">
                <Pill className="w-12 h-12 text-purple-500" />
              </div>
              <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto border-4 border-purple-100">
                <p className="text-4xl font-extrabold tracking-tighter text-purple-500 text-center">
                  Daily<br />Medication
                </p>
              </div>
              <div className="mt-8 w-full">
                {isCompleted ? (
                  <div className="flex items-center justify-center text-green-600 bg-green-50 px-4 py-3 rounded-full">
                    <Check className="w-5 h-5 mr-2" />
                    <span className="font-medium">Great job! Medication taken today</span>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-purple-500 hover:bg-purple-600 text-lg py-6 rounded-2xl"
                    onClick={handleMarkDone}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-6 h-6 mr-2" />
                        Mark Done
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="p-4 bg-accent rounded-md border border-border">
          <p className="text-sm font-medium text-accent-foreground flex items-center justify-center">
            <Pill className="w-4 h-4 mr-2" />
            Completion Prompt: Don't forget your daily medication!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicationLog;