import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check, 
  CloudSun, 
  Play, 
  Pause, 
  RotateCcw,
  Compass,
  Loader2,
  Zap,
  Target,
  Languages,
  BookOpen,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/utils/time-utils";
import { audioManager } from "@/utils/audio";
import { useLabSession, LabStage } from "@/hooks/useLabSession";
import { useSimpleTasks } from "@/hooks/useSimpleTasks";
import { useSession } from "@/contexts/SessionContext";
import confetti from 'canvas-confetti';
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export function HabitLab() {
  const { session } = useSession();
  const { stage, labType, seconds, loading: sessionLoading, updateSession, resetSession } = useLabSession();
  const { tasks, completeTask, loading: tasksLoading } = useSimpleTasks();
  const [isActive, setIsActive] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const labTasks = tasks.filter(t => ['Walking', 'Duolingo', 'Reading'].includes(t.name));
  const currentTask = tasks.find(t => t.name === labType);
  
  const currentGoalSeconds = currentTask?.current_value || 600;
  const stabilityProgress = currentTask?.current_progress || 0;

  useEffect(() => {
    if (!sessionLoading) {
      setLocalSeconds(seconds);
    }
  }, [sessionLoading, seconds]);

  useEffect(() => {
    if (!sessionLoading && !tasksLoading && !labType && labTasks.length > 0) {
      const randomTask = labTasks[Math.floor(Math.random() * labTasks.length)];
      updateSession(randomTask.name, 'start', 0);
    }
  }, [sessionLoading, tasksLoading, labType, labTasks, updateSession]);

  const handleStartAction = async () => {
    audioManager.playSuccess();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    await updateSession(labType!, 'active', 0);
  };

  const toggleTimer = () => {
    if (!isActive) {
      audioManager.prime();
      setIsActive(true);
      audioManager.playStart();
      timerRef.current = setInterval(() => {
        setLocalSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      updateSession(labType!, 'active', localSeconds);
      setIsActive(false);
    }
  };

  const handleFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    
    if (currentTask) {
      const result = await completeTask(currentTask.id);
      audioManager.playSuccess();
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });

      if (result?.increased) {
        toast.success("Level Up!", {
          description: `Your ${labType} goal increased!`,
        });
      } else {
        toast.success(`${labType} Logged!`, {
          description: `${result?.progress}/3 steps to your next goal increase.`,
        });
      }
    }

    await updateSession(labType!, 'complete', localSeconds);
  };

  const handleReset = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setLocalSeconds(0);
    await resetSession();
  };

  if (sessionLoading || tasksLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white/50" />
      </div>
    );
  }

  if (labTasks.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center mb-4">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase italic">Lab is Empty</h2>
        <p className="text-white/60 font-bold max-w-xs">
          The Practice Lab works with specific habits like Walking, Reading, or Duolingo. 
          Accept the templates on the main screen to unlock it!
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
          Swipe left to return
        </p>
      </div>
    );
  }

  if (!labType) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white/50" />
      </div>
    );
  }

  const progressToGoal = Math.min(100, (localSeconds / currentGoalSeconds) * 100);
  const isGoalMet = localSeconds >= currentGoalSeconds;

  const labConfigs: Record<string, any> = {
    'Walking': {
      icon: CloudSun,
      step1Title: "Step 1: Get Out",
      step1Desc: "The hardest part is just crossing the threshold.",
      step1Button: "I'M OUTSIDE!",
      step2Title: "Step 2: Move",
      color: "text-orange-500"
    },
    'Duolingo': {
      icon: Languages,
      step1Title: "Step 1: Open App",
      step1Desc: "Just tap the owl. Don't think about the lesson yet.",
      step1Button: "APP IS OPEN!",
      step2Title: "Step 2: Practice",
      color: "text-green-500"
    },
    'Reading': {
      icon: BookOpen,
      step1Title: "Step 1: Grab Book",
      step1Desc: "Pick up your Kobo or book. Just hold it.",
      step1Button: "I HAVE IT!",
      step2Title: "Step 2: Read",
      color: "text-blue-500"
    }
  };

  const config = labConfigs[labType] || labConfigs['Walking'];
  const Icon = config.icon;

  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-20 p-8 space-y-12 relative">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center mb-6">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Practice Lab</h2>
        
        <div className="max-w-[200px] mx-auto space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
            <span>{labType} Stability</span>
            <span>{stabilityProgress}/3</span>
          </div>
          <Progress value={(stabilityProgress / 3) * 100} className="h-1.5 bg-white/10 [&>div]:bg-white shadow-sm" />
        </div>
      </div>

      <Card className="w-full max-w-md bg-white/10 border-white/20 rounded-[3rem] overflow-hidden shadow-2xl">
        <CardContent className="p-10 space-y-8">
          {stage === 'start' && (
            <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">{config.step1Title}</h3>
                <p className="text-white/60 font-bold">{config.step1Desc}</p>
              </div>
              <div className="w-32 h-32 mx-auto bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl">
                <Icon className={cn("w-16 h-16", config.color)} />
              </div>
              <Button 
                onClick={handleStartAction}
                className={cn("w-full h-24 text-2xl font-black rounded-[2.5rem] bg-white hover:scale-105 transition-all", config.color)}
              >
                {config.step1Button}
              </Button>
            </div>
          )}

          {stage === 'active' && (
            <div className="space-y-8 text-center animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">{config.step2Title}</h3>
                <div className="flex items-center justify-center gap-2 text-white/60 font-bold uppercase text-xs tracking-widest">
                  <Target className="w-4 h-4" />
                  Goal: {Math.floor(currentGoalSeconds / 60)}m
                </div>
              </div>
              
              <div className="relative py-4">
                <div className={cn(
                  "text-7xl font-black tabular-nums tracking-tighter transition-colors duration-500",
                  isGoalMet ? "text-white" : "text-white/90"
                )}>
                  {formatTimeDisplay(localSeconds)}
                </div>
                <div className="mt-4 px-4">
                  <Progress value={progressToGoal} className="h-2 bg-white/10 [&>div]:bg-white" />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={toggleTimer}
                  variant="secondary"
                  className="flex-1 h-20 rounded-[2rem] bg-white/20 text-white border-none hover:bg-white/30"
                >
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button 
                  onClick={handleFinish}
                  disabled={!isGoalMet}
                  className={cn(
                    "flex-[2] h-20 text-xl font-black rounded-[2rem] bg-white transition-all",
                    config.color,
                    !isGoalMet && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  {isGoalMet ? "FINISH" : "KEEP GOING!"}
                </Button>
              </div>
            </div>
          )}

          {stage === 'complete' && (
            <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 mx-auto bg-green-500 rounded-[2rem] flex items-center justify-center shadow-xl">
                <Check className="w-12 h-12 text-white stroke-[4]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">Victory!</h3>
                <p className="text-white/60 font-bold">You showed up for yourself today.</p>
                <div className="flex flex-col items-center gap-2 pt-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                      {Math.floor(localSeconds / 60)}m {localSeconds % 60}s Logged
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleReset}
                variant="ghost"
                className="w-full h-12 text-white/40 hover:text-white font-black uppercase tracking-widest text-xs"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Try Another Lab
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
          Swipe left to return
        </p>
      </div>
    </div>
  );
}