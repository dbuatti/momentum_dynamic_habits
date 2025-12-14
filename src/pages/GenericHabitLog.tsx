import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useHabitLog } from '@/hooks/useHabitLog';
import { initialHabits } from '@/lib/habit-data';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader2, CheckCircle2 } from 'lucide-react';
import NotFound from './NotFound';

interface GenericHabitLogProps {
  habitKey: string;
}

const GenericHabitLog: React.FC<GenericHabitLogProps> = ({ habitKey: propHabitKey }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize habitKey from URL (e.g., 'teeth-brushing' to 'teeth_brushing')
  const normalizedHabitKey = propHabitKey.replace(/-/g, '_');
  const habitConfig = initialHabits.find(h => h.id === normalizedHabitKey);
  
  if (!habitConfig) {
    return <NotFound />;
  }

  const isTimeBased = habitConfig.type === 'time';
  
  // Get initial value from route state or habit config's targetGoal
  const initialValueFromState = (location.state as { duration?: number })?.duration;
  const [value, setValue] = useState<number>(initialValueFromState || habitConfig.targetGoal);
  
  const { mutate: logHabit, isPending } = useHabitLog();

  const handleLog = () => {
    logHabit({
      habitKey: habitConfig.id,
      value: value,
      taskName: habitConfig.name,
    });
  };

  const title = `${habitConfig.name} Log`;
  const unit = habitConfig.unit;
  
  // Determine max value for slider/input. Use a reasonable upper bound.
  const maxInput = isTimeBased ? 180 : 1000; // 180 minutes (3 hours) for time, 1000 reps for count
  const step = isTimeBased && unit === 'min' ? 1 : 1; // 1 minute step for time, 1 rep for count

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <PageHeader title={title} backLink="/" />

      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-lg">{habitConfig.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-6">
          {isTimeBased ? (
            <div className="space-y-4">
              <Label htmlFor="duration" className="text-base">Duration ({unit})</Label>
              <Slider
                id="duration"
                min={1}
                max={maxInput}
                step={step}
                value={[value]}
                onValueChange={(val) => setValue(val[0])}
                className="w-full"
              />
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="h-12 rounded-xl text-center text-lg font-semibold"
                min={1}
                max={maxInput}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Label htmlFor="value" className="text-base">Value ({unit})</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="h-12 rounded-xl text-center text-lg font-semibold"
                min={1}
                max={maxInput}
              />
            </div>
          )}

          <Button
            onClick={handleLog}
            disabled={isPending || value <= 0}
            className="w-full h-12 rounded-xl text-lg"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Log {value} {unit}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenericHabitLog;