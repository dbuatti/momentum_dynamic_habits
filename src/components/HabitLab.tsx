import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Timer, 
  Check, 
  CloudSun, 
  Play, 
  Pause, 
  RotateCcw,
  Compass,
  Loader2,
  TrendingUp,
  Zap,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/utils/time-utils";
import { audioManager } from "@/utils/audio";
import { useLabSession, LabStage } from "@/hooks/useLabSession";
import { useSimpleTasks } from "@/hooks/useSimpleTasks";
import { useSession } from "@/contexts/SessionContext";
import confetti from 'canvas-confetti';
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export function HabitLab() {
  const { session } = useSession();
  const { stage, seconds, loading: sessionLoading, updateSession, resetSession } = useLabSession();
  const { tasks, completeTask, loading: tasksLoading } = useSimpleTasks();
  const [isActive, setIsActive] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Find the Walking task to get the current goal
  const walkingTask = tasks.find(t => t.name === 'Walking');
  const currentGoalSeconds = walkingTask?.current_value || 600; // Default 10 mins
  const stabilityProgress = walkingTask?.current_progress || 0;

  // Sync local timer with DB state on load
  useEffect(() => {
    if (!sessionLoading) {
      setLocalSeconds(seconds);
    }
  }, [sessionLoading, seconds]);

  const handleStepOutside = async () => {
    audioManager.playSuccess();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    await updateSession('walking', 0);
  };

  const toggleTimer = () => {
    if (!isActive) {
      audioManager.playStart();
      timerRef.current = setInterval(() => {
        setLocalSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      updateSession('walking', localSeconds);
    }
    setIsActive(!isActive);
  };

  const handleFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    
    if (walkingTask) {
      const result = await completeTask(walkingTask.id);
      
      audioManager.playSuccess();
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });

      if (result?.increased) {
        toast.success("Level Up!", {
          description: `Your walking goal increased to ${Math.floor(result.newValue / 60)} minutes!`,
        });
      } else {
        toast.success("Walk Logged!", {
          description: `${result?.progress}/3 steps to your next goal increase.`,
        });
      }
    }

    await updateSession('complete', localSeconds);
  };

  const handleReset = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setLocalSeconds(0);
    await resetSession();
  };

  if (sessionLoading || tasksLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white/50" />
      </div>
    );
  }

  const progressToGoal = Math.min(100, (localSeconds / currentGoalSeconds) * 100);
  const isGoalMet = localSeconds >= currentGoalSeconds;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center mb-6">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Practice Lab</h2>
        
        <div className="max-w-[200px] mx-auto space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
            <span>Stability</span>
            <span>{stabilityProgress}/3</span>
          </div>
          <Progress value={(stabilityProgress / 3) * 100} className="h-1.5 bg-white/10 [&>div]:bg-white shadow-sm" />
        </div>
      </div>

      <Card className="w-full max-w-md bg-white/10 border-white/20 rounded-[3rem] overflow-hidden shadow-2xl">
        <CardContent className="p-10 space-y-8">
          {stage === 'outside' && (
            <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">Step 1: Get Out</h3>
                <p className="text-white/60 font-bold">The hardest part is just crossing the threshold.</p>
              </div>
              <div className="w-32 h-32 mx-auto bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl">
                <CloudSun className="w-16 h-16 text-orange-500" />
              </div>
              <Button 
                onClick={handleStepOutside}
                className="w-full h-24 text-2xl font-black rounded-[2.5rem] bg-white text-orange-500 hover:scale-105 transition-all"
              >
                I'M OUTSIDE!
              </Button>
            </div>
          )}

          {stage === 'walking' && (
            <div className="space-y-8 text-center animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">Step 2: Move</h3>
                <div className="flex items-center justify-center gap-2 text-white/60 font-bold uppercase text-xs tracking-widest">
                  <Target className="w-4 h-4" />
                  Goal: {Math.floor(currentGoalSeconds / 60)}m
                </div>
              </div>
              
              <div className="relative py-4">
                <div className={cn(
                  "text-7xl font-black tabular-nums tracking-tighter transition-colors duration-500",
                  isGoalMet ? "text-white" : "text-white/90"
                )}>
                  {formatTimeDisplay(localSeconds)}
                </div>
                <div className="mt-4 px-4">
                  <Progress value={progressToGoal} className="h-2 bg-white/10 [&>div]:bg-white" />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={toggleTimer}
                  variant="secondary"
                  className="flex-1 h-20 rounded-[2rem] bg-white/20 text-white border-none hover:bg-white/30"
                >
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button 
                  onClick={handleFinish}
                  disabled={!isGoalMet}
                  className={cn(
                    "flex-[2] h-20 text-xl font-black rounded-[2rem] bg-white text-orange-500 transition-all",
                    !isGoalMet && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  {isGoalMet ? "FINISH WALK" : "KEEP GOING!"}
                </Button>
              </div>
              
              {!isGoalMet && (
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {Math.ceil((currentGoalSeconds - localSeconds) / 60)} mins remaining to hit goal
                </p>
              )}
            </div>
          )}

          {stage === 'complete' && (
            <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 mx-auto bg-green-500 rounded-[2rem] flex items-center justify-center shadow-xl">
                <Check className="w-12 h-12 text-white stroke-[4]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">Victory!</h3>
                <p className="text-white/60 font-bold">You showed up for yourself today.</p>
                <div className="flex flex-col items-center gap-2 pt-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                      {Math.floor(localSeconds / 60)}m {localSeconds % 60}s Logged
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleReset}
                variant="ghost"
                className="w-full h-12 text-white/40 hover:text-white font-black uppercase tracking-widest text-xs"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Start New Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
          Swipe left to return
        </p>
      </div>
    </div>
  );
}