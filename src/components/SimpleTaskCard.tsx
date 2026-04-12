import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-md mx-auto border-4 border-primary/10 shadow-2xl rounded-[3rem] overflow-hidden bg-card/60 backdrop-blur-md">
      <CardHeader className="text-center pt-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-secondary mb-6 animate-bounce">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-4xl font-black tracking-tight text-primary uppercase italic">{task.name}</CardTitle>
        <CardDescription className="text-lg font-bold text-muted-foreground/70">
          {isTimeTask ? (hasStarted ? (isActive ? 'Focusing...' : 'Paused') : 'Ready when you are!') : `Let's get moving!`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center py-8">
        <button 
          onClick={toggleTimer}
          disabled={!isTimeTask || isTimerFinished}
          className={cn(
            "relative group transition-transform active:scale-90",
            !isTimeTask && "cursor-default"
          )}
        >
          <div className={cn(
            "absolute -inset-12 bg-primary/10 rounded-full blur-3xl transition-opacity",
            isActive ? "opacity-100 animate-pulse" : "opacity-0"
          )} />
          <div className="relative flex items-baseline justify-center">
            <span className={cn(
              "text-9xl font-black text-foreground tabular-nums transition-colors",
              isActive && "text-primary"
            )}>
              {isTimeTask ? timeLeft : task.current_value}
            </span>
            <span className="text-3xl ml-3 font-black text-primary uppercase tracking-tighter">
              {isTimeTask ? 'sec' : 'reps'}
            </span>
          </div>
        </button>

        {isTimeTask && hasStarted && !isTimerFinished && (
          <div className="flex gap-6 mt-10 animate-in fade-in slide-in-from-top-4">
            <Button 
              variant="secondary" 
              size="icon" 
              className="w-16 h-16 rounded-full btn-bubbly shadow-lg"
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-16 h-16 rounded-full btn-bubbly border-2"
              onClick={resetTimer}
            >
              <RotateCcw className="w-8 h-8" />
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 p-10 pt-4">
        {isTimeTask && !hasStarted ? (
          <Button 
            onClick={startTimer}
            className="w-full h-24 text-3xl font-black rounded-[2.5rem] gap-4 shadow-[0_12px_0_0_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-2 transition-all btn-bubbly bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Timer className="w-10 h-10" />
            START!
          </Button>
        ) : (
          <Button 
            onClick={handleComplete} 
            disabled={completing || !canComplete}
            className={cn(
              "w-full h-24 text-3xl font-black rounded-[2.5rem] gap-4 shadow-[0_12px_0_0_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-2 transition-all btn-bubbly",
              !canComplete && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
            <Check className="w-10 h-10 stroke-[4]" />
            DONE!
          </Button>
        )}
        
        {showShuffle && (
          <Button 
            variant="ghost" 
            onClick={onShuffle}
            className="w-full h-14 gap-3 font-black text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-3xl btn-bubbly uppercase tracking-widest text-xs"
          >
            <Shuffle className="w-5 h-5" />
            Try something else?
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}