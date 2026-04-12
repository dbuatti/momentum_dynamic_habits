import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTask } from "@/hooks/useSimpleTasks";
import { Check, Shuffle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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
        toast.success(`Great job! Difficulty increased to ${result.newValue} ${task.task_type === 'time' ? 'seconds' : 'reps'}.`);
      } else {
        toast.success("Task completed!");
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">{task.name}</CardTitle>
        <CardDescription className="text-lg">
          {task.task_type === 'time' ? `Be still for ${task.current_value} seconds` : `Do ${task.current_value} pushups`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="text-6xl font-extrabold text-primary mb-4">
          {task.current_value}
          <span className="text-xl ml-2 text-muted-foreground">
            {task.task_type === 'time' ? 'sec' : 'reps'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button 
          onClick={handleComplete} 
          disabled={completing}
          className="w-full h-16 text-xl gap-2"
        >
          <Check className="w-6 h-6" />
          Complete
        </Button>
        
        {showShuffle && (
          <Button 
            variant="outline" 
            onClick={onShuffle}
            className="w-full gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle Task
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
