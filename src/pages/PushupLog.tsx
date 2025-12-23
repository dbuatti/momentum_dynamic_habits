import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Loader2, Check, Dumbbell, Timer, History, Zap, TrendingUp, Info } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDashboardData } from '@/hooks/useDashboardData';
import RestTimer from '@/components/habits/RestTimer';
import { cn } from '@/lib/utils';

const PushupLog = () => {
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();
  const [totalCount, setTotalCount] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [setsLogged, setSetsLogged] = useState<number[]>([]);
  const { mutate: logHabit, isPending } = useHabitLog();

  const pushupHabit = useMemo(() => 
    dashboardData?.habits.find(h => h.key === 'pushups'), 
  [dashboardData]);

  const dailyGoal = pushupHabit?.dailyGoal || 1;
  const alreadyCompletedToday = pushupHabit?.dailyProgress || 0;
  const remainingGoal = Math.max(0, dailyGoal - alreadyCompletedToday);
  
  // Logic for suggested sets
  const suggestedSets = useMemo(() => {
    if (remainingGoal <= 10) return [remainingGoal];
    const setSize = 5;
    const fullSets = Math.floor(remainingGoal / setSize);
    const remainder = remainingGoal % setSize;
    const sets = Array(fullSets).fill(setSize);
    if (remainder > 0) sets.push(remainder);
    return sets;
  }, [remainingGoal]);

  const handleLog = () => {
    if (totalCount > 0) {
      logHabit({ 
        habitKey: 'pushups', 
        value: totalCount, 
        taskName: 'Push-ups' 
      });
    }
  };

  const handleSetLogged = (reps: number) => {
    setSetsLogged(prev => [...prev, reps]);
    setTotalCount(prev => prev + reps);
    if (totalCount + reps < dailyGoal) {
      setShowRestTimer(true);
    }
  };

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      {showRestTimer && (
        <RestTimer 
          duration={60} 
          onComplete={() => setShowRestTimer(false)} 
          onCancel={() => setShowRestTimer(false)} 
        />
      )}

      <div className="w-full space-y-6">
        <PageHeader title="Log Push-ups" backLink="/" />
        
        {/* Goal Visibility Card */}
        <Card className="rounded-2xl shadow-sm border-0 bg-orange-50/50">
          <CardContent className="p-5">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Today's Goal</p>
                <h3 className="text-3xl font-black text-orange-700">{dailyGoal} <span className="text-lg font-normal">reps</span></h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border",
                  pushupHabit?.is_frozen 
                    ? "bg-blue-50 text-blue-600 border-blue-200" 
                    : "bg-green-50 text-green-600 border-green-200"
                )}>
                  {pushupHabit?.is_frozen ? "STABILIZED" : "PROGRESSIVE"}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>{Math.round(alreadyCompletedToday + totalCount)} / {dailyGoal} completed</span>
                <span>{Math.round(Math.max(0, dailyGoal - (alreadyCompletedToday + totalCount)))} left</span>
              </div>
              <Progress 
                value={((alreadyCompletedToday + totalCount) / dailyGoal) * 100} 
                className="h-2.5 [&>div]:bg-orange-500" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Logging Interface */}
        <Card className="rounded-2xl shadow-lg border-4 border-orange-100 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center">
              <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Dumbbell className="w-8 h-8 text-orange-500" />
              </div>
              
              <div 
                className="p-10 bg-card rounded-full w-44 h-44 flex flex-col items-center justify-center mx-auto cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 border-4 border-orange-50 shadow-inner"
                onClick={() => setTotalCount(c => c + 1)}
              >
                <p className="text-6xl font-black text-orange-500">{totalCount}</p>
                <p className="text-xs font-bold text-muted-foreground mt-1">NEW REPS</p>
              </div>
              
              <div className="flex space-x-6 justify-center mt-8">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="w-14 h-14 rounded-full border-2"
                  onClick={() => setTotalCount(c => Math.max(0, c - 1))}
                  disabled={isPending}
                >
                  <Minus className="w-6 h-6" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="w-14 h-14 rounded-full border-2"
                  onClick={() => setTotalCount(c => c + 1)}
                  disabled={isPending}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Set Grouping Suggestion */}
        {dailyGoal > 5 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Suggested Sets</h4>
            <div className="flex flex-wrap gap-2">
              {suggestedSets.map((reps, idx) => (
                <Button 
                  key={idx}
                  variant="secondary"
                  className="rounded-xl h-12 flex-1 min-w-[80px] border-2 border-transparent hover:border-orange-200"
                  onClick={() => handleSetLogged(reps)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Set of {reps}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Sets History */}
        {setsLogged.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/30">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center">
              <History className="w-3 h-3 mr-1" /> Session Log
            </p>
            <div className="flex flex-wrap gap-2">
              {setsLogged.map((s, i) => (
                <div key={i} className="bg-background border px-3 py-1 rounded-lg text-sm font-medium">
                  Set {i+1}: <span className="text-orange-600">{s} reps</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-4">
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-7 rounded-2xl shadow-lg shadow-orange-200"
            onClick={handleLog}
            disabled={totalCount === 0 || isPending}
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex items-center">
                <Zap className="w-5 h-5 mr-2 fill-current" />
                <span>Log {totalCount} Push-ups</span>
              </div>
            )}
          </Button>

          {/* Projection/Stability Insight */}
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-700">Adaptive Projection</p>
              <p className="text-blue-600/80 leading-relaxed">
                Next goal increase estimated in <strong>{Math.max(0, 5 - (pushupHabit?.weekly_completions || 0))} days</strong> of consistency. Keep focus on the sets!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushupLog;