import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';

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

  return (
    <div className="flex flex-col items-center justify-center"> {/* Removed flex-grow */}
      <div className="text-center space-y-8 w-full max-w-xs">
        <h1 className="text-4xl font-bold text-orange-500">Log Push-ups</h1>
        
        <div 
          className="p-10 bg-card rounded-full w-48 h-48 flex items-center justify-center mx-auto shadow-xl border-4 border-orange-300 cursor-pointer select-none"
          onClick={() => setCount(c => c + 1)}
        >
          <p className="text-7xl font-extrabold">{count}</p>
        </div>

        <div className="flex space-x-4 justify-center">
          <Button size="icon" variant="outline" onClick={() => setCount(c => Math.max(0, c - 1))} disabled={isPending}>
            <Minus className="w-6 h-6" />
          </Button>
          <Button size="icon" variant="outline" onClick={() => setCount(c => c + 1)} disabled={isPending}>
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6" 
          onClick={handleLog} 
          disabled={count === 0 || isPending}
        >
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : `Log ${count} Push-ups`}
        </Button>
      </div>
    </div>
  );
};

export default PushupLog;