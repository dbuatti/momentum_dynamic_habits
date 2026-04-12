import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTask } from "@/hooks/useSimpleTasks";
import { Check, Shuffle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SimpleTaskCardProps {
  task: SimpleTask;
  onComplete: (taskId: string) => Promise<{ increased: boolean; newValue: number } | undefined>;
  onShuffle?: () => void;
  showShuffle?: boolean;
}

export function SimpleTaskCard({ task, onComplete, onShuffle, showShuffle }: SimpleTaskCardProps) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    const result = await onComplete(task.id);
    setCompleting(false);

    if (result) {
      if (result.increased) {
        toast.success(`Yay! Level up! Now ${result.newValue} ${task.task_type === 'time' ? 'seconds' : 'reps'}!`, {
          icon: <Sparkles className="text-yellow-500" />,
        });
      } else {
        toast.success("Task done! You're amazing! ✨");
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-4 border-primary/10 shadow-xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4 animate-bounce">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-4xl font-black tracking-tight text-primary">{task.name}</CardTitle>
        <CardDescription className="text-lg font-medium text-muted-foreground/80">
          {task.task_type === 'time' ? `Stay still for a bit...` : `Let's get moving!`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl" />
          <div className="relative flex items-baseline justify-center">
            <span className="text-8xl font-black text-foreground tabular-nums">
              {task.current_value}
            </span>
            <span className="text-2xl ml-2 font-bold text-primary uppercase tracking-widest">
              {task.task_type === 'time' ? 'sec' : 'reps'}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 p-8 pt-4">
        <Button 
          onClick={handleComplete} 
          disabled={completing}
          className="w-full h-20 text-2xl font-black rounded-[2rem] gap-3 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all btn-bubbly"
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