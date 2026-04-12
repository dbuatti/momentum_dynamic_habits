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
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-xl font-black text-primary uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <TemplateOnboarding onAccept={createTemplates} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container max-w-2xl pt-12 px-8 space-y-12">
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/40 text-primary font-black text-xs uppercase tracking-[0.2em]">
            <Sparkles className="w-4 h-4" />
            Daily Momentum
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground/80">What's next?</h1>
        </header>

        <div className="space-y-12">
          {isOverrideMode ? (
            <div className="grid gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
              <div className="animate-in zoom-in-95 duration-500">
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

        {/* Bottom Control Bar - Borderless & Floating */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-md z-50">
          <div className="bg-white/30 backdrop-blur-2xl p-5 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/60">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="override-mode" className="text-sm font-black uppercase tracking-widest text-primary">Show All</Label>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">Override random</p>
              </div>
            </div>
            <Switch 
              id="override-mode" 
              checked={isOverrideMode} 
              onCheckedChange={setIsOverrideMode}
              className="data-[state=checked]:bg-primary scale-125"
            />
          </div>
        </div>
      </div>
    </div>
  );
}