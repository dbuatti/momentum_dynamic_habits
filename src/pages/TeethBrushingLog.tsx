import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { showError } from '@/utils/toast';

const TeethBrushingLog = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const { mutate: logHabit, isPending } = useHabitLog();

  // Check if already completed today
  useEffect(() => {
    const checkCompletion = () => {
      const today = new Date().toDateString();
      const lastCompleted = localStorage.getItem('teethBrushingLastCompleted');
      if (lastCompleted === today) {
        setIsCompleted(true);
      }
    };
    checkCompletion();
  }, []);

  const handleMarkDone = () => {
    logHabit({
      habitKey: 'teeth_brushing',
      value: 1,
      taskName: 'Brush Teeth'
    });
    
    // Mark as completed for today
    const today = new Date().toDateString();
    localStorage.setItem('teethBrushingLastCompleted', today);
    setIsCompleted(true);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title="Brush Teeth" backLink="/" />
        <Card className="rounded-2xl shadow-lg border-4 border-blue-200 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center">
              <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12 text-blue-500" />
              </div>
              <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto border-4 border-blue-100">
                <p className="text-4xl font-extrabold tracking-tighter text-blue-500 text-center">
                  2 min<br />Brushing
                </p>
              </div>
              <div className="mt-8 w-full">
                {isCompleted ? (
                  <div className="flex items-center justify-center text-green-600 bg-green-50 px-4 py-3 rounded-full">
                    <Check className="w-5 h-5 mr-2" />
                    <span className="font-medium">Great job! Teeth brushed today</span>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-lg py-6 rounded-2xl"
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
            <Sparkles className="w-4 h-4 mr-2" />
            Completion Prompt: Brush for 2 full minutes for healthy teeth!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeethBrushingLog;