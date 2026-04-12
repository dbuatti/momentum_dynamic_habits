import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTask } from "@/hooks/useSimpleTasks";
import { Check, Shuffle, Sparkles, Play, Pause, RotateCcw } from "lucide-react";
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when task changes
  useEffect(() => {
    setTimeLeft(task.current_value);
    setIsActive(false);
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

  const toggleTimer = () => {
    if (!isActive) {
      audioManager.prime(); // Unlock audio on first tap
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
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
          icon: <Sparkles className="text-yellow-500" />,
        });
      } else {
        toast.success("Task done! You're amazing! ✨");
      }
    }
  };

  const isTimeTask = task.task_type === 'time';

  return (
    <Card className="w-full max-w-md mx-auto border-4 border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4 animate-bounce">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-4xl font-black tracking-tight text-primary">{task.name}</CardTitle>
        <CardDescription className="text-lg font-medium text-muted-foreground/80">
          {isTimeTask ? `Stay still for a bit...` : `Let's get moving!`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl" />
          <div className="relative flex items-baseline justify-center">
            <span className={cn(
              "text-8xl font-black text-foreground tabular-nums transition-colors",
              isActive && "text-primary"
            )}>
              {isTimeTask ? timeLeft : task.current_value}
            </span>
            <span className="text-2xl ml-2 font-bold text-primary uppercase tracking-widest">
              {isTimeTask ? 'sec' : 'reps'}
            </span>
          </div>
        </div>

        {isTimeTask && (
          <div className="flex gap-4 mt-8">
            <Button 
              variant="secondary" 
              size="icon" 
              className="w-14 h-14 rounded-full btn-bubbly"
              onClick={toggleTimer}
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="w-14 h-14 rounded-full btn-bubbly"
              onClick={resetTimer}
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 p-8 pt-4">
        <Button 
          onClick={handleComplete} 
          disabled={completing || (isTimeTask && timeLeft > 0)}
          className={cn(
            "w-full h-20 text-2xl font-black rounded-[2rem] gap-3 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all btn-bubbly",
            isTimeTask && timeLeft > 0 && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          <Check className="w-8 h-8 stroke-[3]" />
          DONE!
        </Button>
        
        {showShuffle && (
          <Button 
            variant="ghost" 
            onClick={onShuffle}
            className="w-full h-12 gap-2 font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl btn-bubbly"
          >
            <Shuffle className="w-5 h-5" />
            Try something else?
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}