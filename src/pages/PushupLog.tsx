import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Loader2, Check } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { PageHeader } from '@/components/layout/PageHeader';

const PushupLog = () => {
  const [count, setCount] = useState(0);
  const { mutate: logHabit, isPending } = useHabitLog();

  const handleLog = () => {
    if (count > 0) {
      logHabit({
        habitKey: 'pushups',
        value: count,
        taskName: 'Push-ups',
      });
    }
  };

  const handleMarkDone = () => {
    if (count > 0) {
      logHabit({
        habitKey: 'pushups',
        value: count,
        taskName: 'Push-ups',
      });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xs space-y-8">
        <PageHeader title="Log Push-ups" backLink="/" />
        <div
          className="p-10 bg-card rounded-full w-48 h-48 flex items-center justify-center mx-auto shadow-xl border-4 border-orange-300 cursor-pointer select-none"
          onClick={() => setCount(c => c + 1)}
        >
          <p className="text-7xl font-extrabold">{count}</p>
        </div>
        <div className="flex space-x-4 justify-center">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCount(c => Math.max(0, c - 1))}
            disabled={isPending}
          >
            <Minus className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCount(c => c + 1)}
            disabled={isPending}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-habit-orange hover:bg-orange-600 text-lg py-6"
            onClick={handleLog}
            disabled={count === 0 || isPending}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : `Log ${count} Push-ups`}
          </Button>
          <Button
            className="w-full bg-habit-green hover:bg-habit-green/90 text-lg py-6"
            onClick={handleMarkDone}
            disabled={count === 0 || isPending}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Check className="w-6 h-6 mr-2" /> Mark Done</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PushupLog;