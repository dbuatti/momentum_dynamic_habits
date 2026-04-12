import { useState, useEffect } from 'react';
import { useSimpleTasks, SimpleTask } from '@/hooks/useSimpleTasks';
import { TemplateOnboarding } from '@/components/TemplateOnboarding';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, LayoutGrid, Zap, RefreshCw } from "lucide-react";
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
          <Loader2 className="w-16 h-16 animate-spin text-white" />
          <p className="text-xl font-black text-white uppercase tracking-widest animate-pulse">Loading...</p>
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
      <div className="container max-w-2xl pt-12 px-8 space-y-10">
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/20 text-white font-black text-xs uppercase tracking-[0.2em]">
            <Zap className="w-4 h-4 fill-current" />
            Daily Momentum
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white/90">What's next?</h1>
        </header>

        {!isOverrideMode && (
          <div className="bg-white/10 p-6 rounded-[2.5rem] border border-white/10 text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-center gap-2 text-white">
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Momentum Shift</span>
            </div>
            <p className="text-sm font-bold text-white/80">
              Stuck in a loop? Break the cycle with a quick win.
            </p>
            <Button 
              onClick={shuffleTask} 
              variant="secondary" 
              size="sm"
              className="rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-white text-orange-500 hover:bg-white/90 shadow-sm"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Shift Gears
            </Button>
          </div>
        )}

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
          <div className="bg-white/20 backdrop-blur-2xl p-5 rounded-[2.5rem] flex items-center justify-between shadow-2xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="override-mode" className="text-sm font-black uppercase tracking-widest text-white">Show All</Label>
                <p className="text-[10px] font-bold text-white/60 uppercase">Override random</p>
              </div>
            </div>
            <Switch 
              id="override-mode" 
              checked={isOverrideMode} 
              onCheckedChange={setIsOverrideMode}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/20 scale-125"
            />
          </div>
        </div>
      </div>
    </div>
  );
}