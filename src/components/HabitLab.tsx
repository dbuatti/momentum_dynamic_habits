import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  RefreshCw,
  ChevronRight,
  Brain,
  Sparkles,
  Heart,
  Trophy,
  History,
  ArrowUpRight,
  Timer
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
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

export function HabitLab() {
  const { session } = useSession();
  const { stage, labType, seconds, metadata, loading: sessionLoading, updateSession, resetSession } = useLabSession();
  const { tasks, completeTask, loading: tasksLoading } = useSimpleTasks();
  const [isActive, setIsActive] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(0);
  const [sessionDetail, setSessionDetail] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const labTaskNames = ['Walking', 'Duolingo', 'Reading'];
  const labTasks = tasks.filter(t => labTaskNames.includes(t.name));
  const currentTask = tasks.find(t => t.name === labType);
  
  const currentGoalSeconds = currentTask?.current_value || 600;
  const stabilityProgress = currentTask?.current_progress || 0;

  const labConfigs: Record<string, any> = {
    'Walking': {
      icon: CloudSun,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      adhdTip: "The transition is the hardest part. Don't think about the walk, just think about the shoes.",
      detailLabel: "Extra minutes or steps?",
      detailPlaceholder: "e.g. 5 extra mins",
      futureVision: {
        unit: "hours outside",
        multiplier: 1, // based on minutes
        projections: [
          { years: 1, text: "60 hours of fresh air" },
          { years: 3, text: "A stronger, calmer heart" },
          { years: 5, text: "2,000 miles of exploration" }
        ]
      },
      microSteps: [
        { id: 'shoes', label: "Shoes on", icon: "👟" },
        { id: 'door', label: "Door open", icon: "🚪" },
        { id: 'outside', label: "Step outside", icon: "🌳" }
      ]
    },
    'Duolingo': {
      icon: Languages,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      adhdTip: "Forget the streak. Forget the leaderboard. Just focus on one single sound today.",
      detailLabel: "How many lessons?",
      detailPlaceholder: "e.g. 2 lessons",
      futureVision: {
        unit: "lessons",
        multiplier: 1,
        projections: [
          { years: 1, text: "365 new concepts learned" },
          { years: 3, text: "Conversational confidence" },
          { years: 5, text: "Fluent in a second world" }
        ]
      },
      microSteps: [
        { id: 'phone', label: "Phone in hand", icon: "📱" },
        { id: 'open', label: "App open", icon: "🦉" },
        { id: 'start', label: "Start 1 lesson", icon: "✨" }
      ]
    },
    'Reading': {
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      adhdTip: "If your mind wanders, that's okay. It's just your brain exploring. Gently come back to the next word.",
      detailLabel: "Pages or chapters?",
      detailPlaceholder: "e.g. 10 pages",
      futureVision: {
        unit: "books",
        multiplier: 0.05, // 10 mins ~ 5 pages
        projections: [
          { years: 1, text: "12 books finished" },
          { years: 3, text: "A library of new ideas" },
          { years: 5, text: "A transformed perspective" }
        ]
      },
      microSteps: [
        { id: 'grab', label: "Grab book", icon: "📖" },
        { id: 'open', label: "Open to page", icon: "🔖" },
        { id: 'sentence', label: "Read 1 sentence", icon: "✍️" }
      ]
    }
  };

  const config = useMemo(() => labConfigs[labType || 'Walking'] || labConfigs['Walking'], [labType]);

  useEffect(() => {
    if (!sessionLoading) {
      setLocalSeconds(seconds);
    }
  }, [sessionLoading, seconds]);

  useEffect(() => {
    if (!sessionLoading && !tasksLoading && !labType && labTasks.length > 0) {
      updateSession(labTasks[0].name, 'start', 0, { completedMicroSteps: [] });
    }
  }, [sessionLoading, tasksLoading, labType, labTasks, updateSession]);

  const handleSwitchTask = async () => {
    const currentIndex = labTaskNames.indexOf(labType || '');
    const nextIndex = (currentIndex + 1) % labTaskNames.length;
    const nextTaskName = labTaskNames[nextIndex];
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setLocalSeconds(0);
    setSessionDetail('');
    await updateSession(nextTaskName, 'start', 0, { completedMicroSteps: [] });
  };

  const toggleMicroStep = async (stepId: string) => {
    const currentSteps = metadata?.completedMicroSteps || [];
    const isAlreadyDone = currentSteps.includes(stepId);
    
    let nextSteps;
    if (isAlreadyDone) {
      nextSteps = currentSteps.filter((id: string) => id !== stepId);
    } else {
      nextSteps = [...currentSteps, stepId];
      audioManager.playStart();
    }

    await updateSession(labType!, stage, localSeconds, { ...metadata, completedMicroSteps: nextSteps });

    if (!isAlreadyDone && nextSteps.length === config.microSteps.length && stage === 'start') {
      setTimeout(() => {
        handleStartAction();
      }, 1500);
    }
  };

  const handleStartAction = async () => {
    audioManager.playSuccess();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    await updateSession(labType!, 'active', 0, metadata);
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
      updateSession(labType!, 'active', localSeconds, metadata);
      setIsActive(false);
    }
  };

  const handleFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    
    if (currentTask) {
      // We pass the sessionDetail as a note to the completeTask function
      const result = await completeTask(currentTask.id);
      audioManager.playSuccess();
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });

      if (result?.increased) {
        toast.success("Level Up!", { description: `Your ${labType} goal increased!` });
      } else {
        toast.success(`${labType} Logged!`, { description: `${result?.progress}/3 steps to your next goal increase.` });
      }
    }

    await updateSession(labType!, 'complete', localSeconds, { ...metadata, sessionDetail });
  };

  const handleReset = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setLocalSeconds(0);
    setSessionDetail('');
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
        </p>
      </div>
    );
  }

  const progressToGoal = Math.min(100, (localSeconds / currentGoalSeconds) * 100);
  const isGoalMet = localSeconds >= currentGoalSeconds;
  const completedMicroSteps = metadata?.completedMicroSteps || [];

  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-16 p-6 space-y-8 relative">
      {/* Header Section */}
      <div className="text-center space-y-4 w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSwitchTask}
            className="rounded-full bg-white/10 text-white hover:bg-white/20 font-black uppercase text-[10px] tracking-widest h-8 px-4"
          >
            <RefreshCw className="w-3 h-3 mr-2" /> Cycle Lab
          </Button>
        </div>
        
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic text-left">{labType}</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
            <span>Stability Progress</span>
            <span>{stabilityProgress}/3</span>
          </div>
          <Progress value={(stabilityProgress / 3) * 100} className="h-1.5 bg-white/10 [&>div]:bg-white shadow-sm" />
        </div>
      </div>

      {/* ADHD Coaching Card */}
      <Card className="w-full max-w-md bg-white/5 border-white/10 rounded-3xl overflow-hidden">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="bg-white/10 p-2 rounded-xl shrink-0">
            <Brain className="w-5 h-5 text-white/80" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Coach's Insight</p>
            <p className="text-xs font-bold text-white/80 leading-relaxed italic">"{config.adhdTip}"</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Lab Interface */}
      <Card className="w-full max-w-md bg-white/10 border-white/20 rounded-[3rem] overflow-hidden shadow-2xl">
        <CardContent className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {stage === 'start' && (
              <motion.div 
                key="start"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase">Initiation Phase</h3>
                  <p className="text-white/60 text-sm font-bold">Check off these micro-wins to build momentum.</p>
                </div>

                <div className="grid gap-3">
                  {config.microSteps.map((step: any) => {
                    const isDone = completedMicroSteps.includes(step.id);
                    return (
                      <button
                        key={step.id}
                        onClick={() => toggleMicroStep(step.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                          isDone 
                            ? "bg-white text-orange-500 border-white scale-[0.98]" 
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xl">{step.icon}</span>
                          <span className="font-black uppercase text-sm tracking-tight">{step.label}</span>
                        </div>
                        {isDone && <Check className="w-5 h-5 stroke-[4]" />}
                      </button>
                    );
                  })}
                </div>

                <Button 
                  onClick={handleStartAction}
                  disabled={completedMicroSteps.length === 0}
                  className={cn(
                    "w-full h-20 text-xl font-black rounded-[2.5rem] bg-white transition-all shadow-xl",
                    config.color,
                    completedMicroSteps.length === 0 && "opacity-50 grayscale"
                  )}
                >
                  {completedMicroSteps.length === config.microSteps.length ? "LET'S GO!" : "START ANYWAY"}
                </Button>
              </motion.div>
            )}

            {stage === 'active' && (
              <motion.div 
                key="active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-white/60 font-black uppercase text-[10px] tracking-[0.3em]">
                    <Target className="w-3 h-3" />
                    Goal: {Math.floor(currentGoalSeconds / 60)}m
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase italic">In Progress</h3>
                </div>
                
                <div className="relative py-4">
                  <div className={cn(
                    "text-8xl font-black tabular-nums tracking-tighter transition-colors duration-500",
                    isGoalMet ? "text-white" : "text-white/90"
                  )}>
                    {formatTimeDisplay(localSeconds)}
                  </div>
                  <div className="mt-6 px-4">
                    <Progress value={progressToGoal} className="h-2 bg-white/10 [&>div]:bg-white" />
                  </div>
                </div>

                {/* Future Horizon Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-white/40" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Future Horizon</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {config.futureVision.projections.map((proj: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <p className="text-[8px] font-black text-white/30 uppercase">{proj.years} Year{proj.years > 1 ? 's' : ''}</p>
                        <p className="text-[10px] font-bold text-white/80 leading-tight">{proj.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={toggleTimer}
                    variant="secondary"
                    className="flex-1 h-20 rounded-[2rem] bg-white/20 text-white border-none hover:bg-white/30"
                  >
                    {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                  </Button>
                  <Button 
                    onClick={handleFinish}
                    className={cn(
                      "flex-[2] h-20 text-2xl font-black rounded-[2rem] bg-white transition-all shadow-2xl",
                      config.color
                    )}
                  >
                    {isGoalMet ? "FINISH" : "DONE FOR NOW"}
                  </Button>
                </div>
              </motion.div>
            )}

            {stage === 'complete' && (
              <motion.div 
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 text-center"
              >
                <div className="w-24 h-24 mx-auto bg-green-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <Check className="w-12 h-12 text-white stroke-[4]" />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-4xl font-black text-white uppercase italic">Victory!</h3>
                    <p className="text-white/60 font-bold">You bypassed the resistance.</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">{config.detailLabel}</Label>
                      <Input 
                        value={sessionDetail}
                        onChange={(e) => setSessionDetail(e.target.value)}
                        placeholder={config.detailPlaceholder}
                        className="bg-white/10 border-white/20 text-white text-center h-12 rounded-xl font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10">
                      <Timer className="w-4 h-4 text-white/40" />
                      <span className="text-xs font-black text-white uppercase tracking-widest">
                        {Math.floor(localSeconds / 60)}m {localSeconds % 60}s Logged
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleReset}
                    variant="ghost"
                    className="w-full h-14 text-white/40 hover:text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/5"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Try Another Lab
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation Hint */}
      <div className="flex flex-col items-center gap-2 opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">
          Swipe left to return
        </p>
      </div>
    </div>
  );
}