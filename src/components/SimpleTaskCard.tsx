import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { SimpleTask } from "@/hooks/useSimpleTasks";
import { Check, Shuffle, Sparkles, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { audioManager } from "@/utils/audio";

interface SimpleTaskCardProps {
  task: SimpleTask;
  onComplete: (taskId: string) => Promise<{ increased: boolean; newValue: number } | undefined>;
  onShuffle?: () => void;
  showShuffle?: boolean;
}

export function SimpleTaskCard({ task, onComplete, onShuffle, showShuffle }: SimpleTaskCardProps) {
  const [completing, setCompleting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(task.current_value);
  const [isActive, setIsActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      toast.info("Time's up! ✨", {
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
    setCompleting(false);

    if (result) {
      audioManager.playSuccess();
      if (result.increased) {
        toast.success(`Yay! Level up! Now ${result.newValue} ${task.task_type === 'time' ? 'seconds' : 'reps'}!`, {
          icon: <Sparkles className="text-orange-500" />,
        });
      } else {
        toast.success("Task done! You're amazing! ✨");
      }
    }
  };

  const isTimeTask = task.task_type === 'time';
  const isTimerFinished = isTimeTask && timeLeft === 0;
  const canComplete = !isTimeTask || isTimerFinished;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-8 py-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white/40 mb-2 animate-bounce">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-primary uppercase italic">{task.name}</h2>
        <p className="text-xl font-bold text-muted-foreground/60">
          {isTimeTask ? (hasStarted ? (isActive ? 'Focusing...' : 'Paused') : 'Ready when you are!') : `Let's get moving!`}
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center w-full py-4">
        <button 
          onClick={toggleTimer}
          disabled={!isTimeTask || isTimerFinished}
          className={cn(
            "relative group transition-transform active:scale-90",
            !isTimeTask && "cursor-default"
          )}
        >
          <div className={cn(
            "absolute -inset-16 bg-primary/20 rounded-full blur-3xl transition-opacity",
            isActive ? "opacity-100 animate-pulse" : "opacity-0"
          )} />
          <div className="relative flex items-baseline justify-center">
            <span className={cn(
              "text-[10rem] font-black text-foreground tabular-nums transition-colors leading-none",
              isActive && "text-primary"
            )}>
              {isTimeTask ? timeLeft : task.current_value}
            </span>
            <span className="text-4xl ml-4 font-black text-primary uppercase tracking-tighter">
              {isTimeTask ? 'sec' : 'reps'}
            </span>
          </div>
        </button>

        {isTimeTask && hasStarted && !isTimerFinished && (
          <div className="flex gap-8 mt-12 animate-in fade-in slide-in-from-top-4">
            <Button 
              variant="secondary" 
              size="icon" 
              className="w-20 h-20 rounded-full shadow-xl bg-white/50 hover:bg-white/80"
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-20 h-20 rounded-full border-4 border-white/50 bg-transparent hover:bg-white/20"
              onClick={resetTimer}
            >
              <RotateCcw className="w-10 h-10" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 w-full pt-8">
        {isTimeTask && !hasStarted ? (
          <Button 
            onClick={startTimer}
            className="w-full h-28 text-4xl font-black rounded-[3rem] gap-4 bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Timer className="w-12 h-12" />
            START!
          </Button>
        ) : (
          <Button 
            onClick={handleComplete} 
            disabled={completing || !canComplete}
            className={cn(
              "w-full h-28 text-4xl font-black rounded-[3rem] gap-4 bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all",
              !canComplete && "opacity-30 cursor-not-allowed grayscale"
            )}
          >
            <Check className="w-12 h-12 stroke-[5]" />
            DONE!
          </Button>
        )}
        
        {showShuffle && (
          <Button 
            variant="ghost" 
            onClick={onShuffle}
            className="w-full h-16 gap-3 font-black text-muted-foreground/50 hover:text-primary hover:bg-white/20 rounded-[2rem] uppercase tracking-widest text-sm"
          >
            <Shuffle className="w-6 h-6" />
            Try something else?
          </Button>
        )}
      </div>
    </div>
  );
}