import { useState, useEffect } from 'react';
import { useSimpleTasks, SimpleTask } from '@/hooks/useSimpleTasks';
import { TemplateOnboarding } from '@/components/TemplateOnboarding';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const { session, loading: sessionLoading } = useSession();
  const { tasks, loading: tasksLoading, createTemplates, completeTask } = useSimpleTasks();
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [randomTask, setRandomTask] = useState<SimpleTask | null>(null);
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/login');
    }
  }, [session, sessionLoading, navigate]);

  // Pick a random task when tasks change or when shuffle is clicked
  const shuffleTask = () => {
    if (tasks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tasks.length);
      setRandomTask(tasks[randomIndex]);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 && !randomTask) {
      shuffleTask();
    }
  }, [tasks]);

  if (sessionLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  if (tasks.length === 0) {
    return (
      <div className="container max-w-4xl py-12">
        <TemplateOnboarding onAccept={createTemplates} />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12 px-4 space-y-8">
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
        <div className="space-y-0.5">
          <Label htmlFor="override-mode" className="text-base">Override Mode</Label>
          <p className="text-sm text-muted-foreground">Show all tasks instead of random</p>
        </div>
        <Switch 
          id="override-mode" 
          checked={isOverrideMode} 
          onCheckedChange={setIsOverrideMode} 
        />
      </div>

      <div className="space-y-6">
        {isOverrideMode ? (
          <div className="grid gap-6">
            {tasks.map(task => (
              <SimpleTaskCard 
                key={task.id} 
                task={task} 
                onComplete={completeTask} 
              />
            ))}
          </div>
        ) : (
          randomTask && (
            <SimpleTaskCard 
              task={randomTask} 
              onComplete={completeTask} 
              onShuffle={shuffleTask}
              showShuffle={tasks.length > 1}
            />
          )
        )}
      </div>
    </div>
  );
}