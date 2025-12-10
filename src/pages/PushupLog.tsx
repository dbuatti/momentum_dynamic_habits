import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Loader2, Check } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PushupLog = () => {
  const [count, setCount] = useState(0);
  const { mutate: logHabit, isPending } = useHabitLog();

  const handleLog = () => {
    if (count > 0) {
      logHabit({ habitKey: 'pushups', value: count, taskName: 'Push-ups' });
    }
  };

  const handleMarkDone = () => {
    if (count > 0) {
      logHabit({ habitKey: 'pushups', value: count, taskName: 'Push-ups' });
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title="Log Push-ups" backLink="/" />
        
        <Card className="rounded-2xl shadow-lg border-4 border-orange-300">
          <CardContent className="p-8">
            <div 
              className="p-12 bg-card rounded-full w-48 h-48 flex items-center justify-center mx-auto cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
              onClick={() => setCount(c => c + 1)}
            >
              <p className="text-7xl font-extrabold text-orange-500">{count}</p>
            </div>
            
            <div className="flex space-x-6 justify-center mt-8">
              <Button 
                size="icon" 
                variant="outline" 
                className="w-14 h-14 rounded-full"
                onClick={() => setCount(c => Math.max(0, c - 1))}
                disabled={isPending}
              >
                <Minus className="w-6 h-6" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                className="w-14 h-14 rounded-full"
                onClick={() => setCount(c => c + 1)}
                disabled={isPending}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-habit-orange hover:bg-orange-600 text-lg py-6 rounded-2xl"
            onClick={handleLog}
            disabled={count === 0 || isPending}
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              `Log ${count} Push-ups`
            )}
          </Button>
          
          <Separator className="my-2" />
          
          <Button 
            className="w-full bg-habit-green hover:bg-habit-green/90 text-habit-green-foreground text-lg py-6 rounded-2xl"
            onClick={handleMarkDone}
            disabled={count === 0 || isPending}
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Check className="w-6 h-6 mr-2" /> Mark Done
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PushupLog;