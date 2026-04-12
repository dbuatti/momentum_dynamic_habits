import { useState, useEffect, useMemo, useRef } from 'react';
import { useSimpleTasks, SimpleTask } from '@/hooks/useSimpleTasks';
import { TemplateOnboarding } from '@/components/TemplateOnboarding';
import { SimpleTaskCard } from '@/components/SimpleTaskCard';
import { DayReminder } from '@/components/DayReminder';
import { HabitLab } from '@/components/HabitLab';
import { ScreenBreakTimer } from '@/components/ScreenBreakTimer';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, LayoutGrid, RefreshCw, ChevronRight, ChevronLeft, Moon, Sparkles } from "lucide-react";
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { getTodayDateString } from '@/utils/time-utils';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';

export default function Index() {
  const { session, loading: sessionLoading } = useSession();
  const { tasks, loading: tasksLoading, skipTask, completeTask } = useSimpleTasks();
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [randomTask, setRandomTask] = useState<SimpleTask | null>(null);
  const [view, setView] = useState<'lab' | 'task' | 'day'>('task');
  const navigate = useNavigate();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/login');
    }
  }, [session, sessionLoading, navigate]);

  const isTaskSkippedToday = (task: SimpleTask) => {
    if (!task.last_skipped_at) return false;
    return isSameDay(new Date(task.last_skipped_at), new Date());
  };

  const eligibleTasks = useMemo(() => {
    const currentHour = new Date().getHours();
    const labTaskNames = ['Walking', 'Duolingo', 'Reading'];
    const specialTaskNames = ['Screen Break'];

    return tasks.filter(task => {
      if (labTaskNames.includes(task.name) || specialTaskNames.includes(task.name)) {
        return false;
      }

      if (task.name === 'Brush Teeth (Morning)') {
        return currentHour >= 0 && currentHour < 12;
      }
      if (task.name === 'Brush Teeth (Evening)') {
        return currentHour >= 18 && currentHour <= 23;
      }
      return true;
    });
  }, [tasks]);

  const labTasks = useMemo(() => {
    return tasks.filter(t => ['Walking', 'Duolingo', 'Reading'].includes(t.name));
  }, [tasks]);

  // Tier 1: Central tasks done (completed or skipped)
  const isCentralDone = useMemo(() => {
    if (eligibleTasks.length === 0) return false;
    return eligibleTasks.every(t => t.completed_today || isTaskSkippedToday(t));
  }, [eligibleTasks]);

  // Tier 2: Lab tasks also done
  const isLabDone = useMemo(() => {
    if (labTasks.length === 0) return false;
    return labTasks.every(t => t.completed_today);
  }, [labTasks]);

  const isAllDone = isCentralDone && isLabDone;

  const shuffleTask = () => {
    const remainingTasks = eligibleTasks.filter(t => !t.completed_today && !isTaskSkippedToday(t));
    if (remainingTasks.length > 0) {
      if (remainingTasks.length > 1 && randomTask) {
        const otherTasks = remainingTasks.filter(t => t.id !== randomTask.id);
        const randomIndex = Math.floor(Math.random() * otherTasks.length);
        setRandomTask(otherTasks[randomIndex]);
      } else {
        const randomIndex = Math.floor(Math.random() * remainingTasks.length);
        setRandomTask(remainingTasks[randomIndex]);
      }
    } else {
      setRandomTask(null);
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

  const handleSkip = async (taskId: string) => {
    await skipTask(taskId);
    shuffleTask();
  };

  useEffect(() => {
    if (eligibleTasks.length > 0 && !randomTask) {
      shuffleTask();
    }
  }, [eligibleTasks]);

  const getXOffset = () => {
    if (view === 'lab') return '0%';
    if (view === 'task') return '-33.333%';
    if (view === 'day') return '-66.666%';
    return '-33.333%';
  };

  useEffect(() => {
    controls.start({ x: getXOffset() });
  }, [view, controls]);

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

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    const { offset, velocity } = info;

    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
        if (view === 'lab') setView('task');
        else if (view === 'task') setView('day');
        else controls.start({ x: getXOffset() });
      } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
        if (view === 'day') setView('task');
        else if (view === 'task') setView('lab');
        else controls.start({ x: getXOffset() });
      } else {
        controls.start({ x: getXOffset() });
      }
    } else {
      controls.start({ x: getXOffset() });
    }
  };

  return (
    <div className={cn(
      "h-screen transition-colors duration-1000 overflow-hidden touch-pan-y select-none",
      isAllDone ? "bg-black" : isCentralDone ? "bg-[#1a0d00]" : "bg-background"
    )}>
      {/* Darkness Overlays */}
      <AnimatePresence>
        {isCentralDone && !isAllDone && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 pointer-events-none bg-black/40"
          />
        )}
        {isAllDone && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 pointer-events-none bg-black/80"
          />
        )}
      </AnimatePresence>

      <motion.div 
        ref={containerRef}
        className="flex w-[300%] h-full relative z-10"
        animate={controls}
        initial={{ x: getXOffset() }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
      >
        {/* Lab View (Left) */}
        <div className={cn(
          "w-screen h-full overflow-y-auto transition-opacity duration-700",
          isAllDone ? "opacity-20" : "opacity-100"
        )}>
          <HabitLab />
        </div>

        {/* Task View (Center) */}
        <div className="w-screen h-full relative overflow-hidden">
          <div className="absolute top-10 right-10 z-[100]">
            <ScreenBreakTimer />
          </div>
          
          <div className="h-full overflow-y-auto pb-48">
            <div className={cn(
              "container max-w-2xl pt-20 px-8 space-y-10 transition-all duration-1000",
              isAllDone ? "opacity-10 scale-95 grayscale" : isCentralDone ? "opacity-30 scale-98" : "opacity-100"
            )}>
              
              {isCentralDone && (
                <div className="text-center space-y-2 animate-in fade-in zoom-in duration-1000">
                  <div className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Moon className="w-8 h-8 text-white/40" />
                  </div>
                  <h3 className="text-2xl font-black text-white/40 uppercase italic tracking-tighter">Done for now</h3>
                  <p className="text-xs font-bold text-white/20 uppercase tracking-[0.3em]">Central tasks complete</p>
                </div>
              )}

              {!isOverrideMode && eligibleTasks.length > 1 && !isCentralDone && (
                <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
                  <Button 
                    onClick={shuffleTask} 
                    variant="ghost" 
                    size="icon"
                    className="w-10 h-10 rounded-full text-white/20 hover:text-white hover:bg-white/10 transition-all active:rotate-180 duration-500"
                    title="Shuffle Task"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                </div>
              )}

              <div className="space-y-12">
                {isOverrideMode ? (
                  <div className="grid gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {eligibleTasks.map(task => (
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
                        onShuffle={() => handleSkip(randomTask.id)}
                        showShuffle={true}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="flex justify-between items-center px-4 pt-8 opacity-20">
                <div className="flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3 text-white" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Lab</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Day</span>
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day Reminder View (Right) */}
        <div className={cn(
          "w-screen h-full overflow-hidden transition-opacity duration-700",
          isAllDone ? "opacity-10" : "opacity-100"
        )}>
          <DayReminder />
        </div>
      </motion.div>

      <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-md z-50 transition-all duration-1000",
        isAllDone ? "opacity-20 translate-y-4 grayscale" : "opacity-100"
      )}>
        <div className="bg-white/20 backdrop-blur-3xl p-5 rounded-[2.5rem] flex items-center justify-between shadow-2xl border border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/20">
              {isAllDone ? <Sparkles className="w-6 h-6 text-white" /> : <LayoutGrid className="w-6 h-6 text-white" />}
            </div>
            <div className="flex flex-col">
              <Label htmlFor="override-mode" className="text-sm font-black uppercase tracking-widest text-white">
                {isAllDone ? "Day Complete" : "Show All"}
              </Label>
              <p className="text-[10px] font-bold text-white/60 uppercase">
                {isAllDone ? "Rest well" : "Override random"}
              </p>
            </div>
          </div>
          {!isAllDone && (
            <Switch 
              id="override-mode" 
              checked={isOverrideMode} 
              onCheckedChange={setIsOverrideMode}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/20 scale-125"
            />
          )}
        </div>
      </div>
    </div>
  );
}