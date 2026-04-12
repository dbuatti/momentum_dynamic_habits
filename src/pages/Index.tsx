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
      if (tasks.length > 1 && randomTask) {
        const otherTasks = tasks.filter(t => t.id !== randomTask.id);
        const randomIndex = Math.floor(Math.random() * otherTasks.length);
        setRandomTask(otherTasks[randomIndex]);
      } else {
        const randomIndex = Math.floor(Math.random() * tasks.length);
        setRandomTask(tasks[randomIndex]);
      }
    }
  };

  const handleComplete = async (taskId: string) => {
    const result = await completeTask(taskId);
    
    if (result && !isOverrideMode) {
      setTimeout(() => {
        shuffleTask();
      }, 2000);
    }
    
    return result;
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
    <div className="min-h-screen bg-background pb-48">
      <div className="container max-w-2xl pt-20 px-8 space-y-10">
        {!isOverrideMode && tasks.length > 1 && (
          <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
            <Button 
              onClick={shuffleTask} 
              variant="ghost" 
              size="icon"
              className="w-12 h-12 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:rotate-180 duration-500"
              title="Shuffle Task"
            >
              <RefreshCw className="w-6 h-6" />
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
                  onComplete={handleComplete} 
                />
              ))}
            </div>
          ) : (
            randomTask && (
              <div className="animate-in zoom-in-95 duration-500">
                <SimpleTaskCard 
                  task={randomTask} 
                  onComplete={handleComplete} 
                  onShuffle={shuffleTask}
                  showShuffle={false} // Hidden here as we have the top icon now
                />
              </div>
            )
          )}
        </div>

        {/* Bottom Control Bar - Floating Glass */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-md z-50">
          <div className="bg-white/20 backdrop-blur-3xl p-5 rounded-[2.5rem] flex items-center justify-between shadow-2xl border border-white/20">
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