import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { SimpleTask } from "@/hooks/useSimpleTasks";
import { Check, Shuffle, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { audioManager } from "@/utils/audio";
import { Progress } from "@/components/ui/progress";

interface SimpleTaskCardProps {
  task: SimpleTask;
  onComplete: (taskId: string) => Promise<{ increased: boolean; newValue: number; progress: number; threshold: number } | undefined>;
  onShuffle?: () => void;
  showShuffle?: boolean;
}

export function SimpleTaskCard({ task, onComplete, onShuffle, showShuffle }: SimpleTaskCardProps) {
  const [completing, setCompleting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(task.current_value);
  const [isActive, setIsActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const STABILITY_THRESHOLD = 3;

  // Reset local state when the task changes or levels up
  useEffect(() => {
    setTimeLeft(task.current_value);
    setIsActive(false);
    setHasStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [task.id, task.current_value]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      audioManager.playTimerEnd();
      if (timerRef.current) clearInterval(timerRef.current);
      toast.info("Time's up!", {
        description: `You finished your ${task.name} session!`,
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, task.name]);

  const startTimer = () => {
    audioManager.prime();
    setIsActive(true);
    setHasStarted(true);
    audioManager.playStart();
  };

  const toggleTimer = () => {
    if (!hasStarted) {
      startTimer();
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setHasStarted(false);
    setTimeLeft(task.current_value);
  };

  const handleComplete = async () => {
    setCompleting(true);
    const result = await onComplete(task.id);
    
    if (result) {
      audioManager.playSuccess();
      if (result.increased) {
        toast.success(`Level Up! Now ${result.newValue} ${task.task_type === 'time' ? 'seconds' : 'reps'}!`);
      } else {
        toast.success(`Great job! ${result.progress}/${result.threshold} steps to level up!`);
      }
      
      // Reset local state immediately so the UI reflects the new progress/value
      setIsActive(false);
      setHasStarted(false);
      setTimeLeft(result.newValue);
    }
    
    setCompleting(false);
  };

  const isTimeTask = task.task_type === 'time';
  const isTimerFinished = isTimeTask && timeLeft === 0;
  const canComplete = !isTimeTask || isTimerFinished;

  const progressPercent = (task.current_progress / STABILITY_THRESHOLD) * 100;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6 py-4">
      <div className="text-center space-y-4 w-full">
        <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic">{task.name}</h2>
        
        <div className="max-w-[180px] mx-auto space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
            <span>Stability</span>
            <span>{task.current_progress}/{STABILITY_THRESHOLD}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5 bg-white/10 [&>div]:bg-white shadow-sm" />
        </div>

        <p className="text-lg font-bold text-white/60 uppercase tracking-widest">
          {isTimeTask 
            ? (hasStarted 
                ? (isActive ? 'Focusing...' : (timeLeft === 0 ? 'Session Complete!' : 'Paused')) 
                : 'Ready when you are!') 
            : `Let's get moving!`}
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center w-full py-2">
        <button 
          onClick={toggleTimer}
          disabled={!isTimeTask || isTimerFinished}
          className={cn(
            "relative group transition-transform active:scale-90",
            !isTimeTask && "cursor-default"
          )}
        >
          <div className={cn(
            "absolute -inset-20 bg-white/10 rounded-full blur-[100px] transition-opacity duration-1000",
            isActive ? "opacity-100 animate-pulse" : "opacity-0"
          )} />
          <div className="relative flex items-baseline justify-center">
            <span className={cn(
              "text-[10rem] sm:text-[12rem] font-black text-white tabular-nums transition-all leading-none tracking-tighter",
              !isActive && "text-white/90"
            )}>
              {isTimeTask ? timeLeft : task.current_value}
            </span>
            <span className="text-3xl sm:text-4xl ml-4 font-black text-white uppercase tracking-tighter opacity-80">
              {isTimeTask ? 'sec' : 'reps'}
            </span>
          </div>
        </button>

        {isTimeTask && hasStarted && !isTimerFinished && (
          <div className="flex gap-8 mt-8 animate-in fade-in slide-in-from-top-4">
            <Button 
              variant="secondary" 
              size="icon" 
              className="w-16 h-16 rounded-full shadow-2xl bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md"
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-16 h-16 rounded-full border-4 border-white/20 bg-transparent hover:bg-white/10 text-white backdrop-blur-md"
              onClick={resetTimer}
            >
              <RotateCcw className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 w-full pt-4">
        {isTimeTask && !hasStarted ? (
          <Button 
            onClick={startTimer}
            className="w-full h-24 text-3xl font-black rounded-[3rem] gap-4 bg-white text-orange-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all"
          >
            <Timer className="w-10 h-10" />
            START!
          </Button>
        ) : (
          <Button 
            onClick={handleComplete} 
            disabled={completing || !canComplete}
            className={cn(
              "w-full h-24 text-3xl font-black rounded-[3rem] gap-4 bg-white text-orange-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all",
              !canComplete && "opacity-30 cursor-not-allowed grayscale"
            )}
          >
            <Check className="w-10 h-10 stroke-[5]" />
            DONE!
          </Button>
        )}
        
        {showShuffle && (
          <Button 
            variant="ghost" 
            onClick={onShuffle}
            className="w-full h-12 gap-3 font-black text-white/40 hover:text-white hover:bg-white/10 rounded-[2rem] uppercase tracking-widest text-[10px] transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Try something else?
          </Button>
        )}
      </div>
    </div>
  );
}