import { useState, useEffect } from 'react';
import { useSimpleTasks, SimpleTask } from '@/hooks/useSimpleTasks';
import { TemplateOnboarding } from '@/components/TemplateOnboarding';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, LayoutGrid, Sparkles } from "lucide-react";
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const { session, loading: sessionLoading } = useSession();
  const { tasks, loading: tasksLoading, createTemplates, completeTask } = useSimpleTasks();
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [randomTask, setRandomTask] = useState<SimpleTask | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/login');
    }
  }, [session, sessionLoading, navigate]);

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="font-bold text-primary animate-pulse">Getting things ready...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <TemplateOnboarding onAccept={createTemplates} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl pt-8 px-6 space-y-8">
        <header className="flex flex-col items-center text-center space-y-2 mb-4">
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary font-black text-xs uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Daily Momentum
          </div>
          <h1 className="text-3xl font-black tracking-tight">What's next?</h1>
        </header>

        <div className="space-y-6">
          {isOverrideMode ? (
            <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <div className="animate-in zoom-in-95 duration-300">
                <SimpleTaskCard 
                  task={randomTask} 
                  onComplete={completeTask} 
                  onShuffle={shuffleTask}
                  showShuffle={tasks.length > 1}
                />
              </div>
            )
          )}
        </div>

        {/* Bottom Control Bar for Mobile */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50">
          <div className="bg-card/80 backdrop-blur-xl border-2 border-primary/10 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="override-mode" className="text-sm font-black uppercase tracking-tight">Show All</Label>
                <p className="text-[10px] font-bold text-muted-foreground">Override random</p>
              </div>
            </div>
            <Switch 
              id="override-mode" 
              checked={isOverrideMode} 
              onCheckedChange={setIsOverrideMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}