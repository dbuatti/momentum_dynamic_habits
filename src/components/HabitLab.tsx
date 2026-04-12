import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Timer, 
  Check, 
  CloudSun, 
  Play, 
  Pause, 
  RotateCcw,
  Compass,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/utils/time-utils";
import { audioManager } from "@/utils/audio";
import { useLabSession, LabStage } from "@/hooks/useLabSession";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import confetti from 'canvas-confetti';
import { toast } from "sonner";

export function HabitLab() {
  const { session } = useSession();
  const { stage, seconds, loading, updateSession, resetSession } = useLabSession();
  const [isActive, setIsActive] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local timer with DB state on load
  useEffect(() => {
    if (!loading) {
      setLocalSeconds(seconds);
    }
  }, [loading, seconds]);

  const handleStepOutside = async () => {
    audioManager.playSuccess();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    await updateSession('walking', 0);
  };

  const toggleTimer = () => {
    if (!isActive) {
      audioManager.playStart();
      timerRef.current = setInterval(() => {
        setLocalSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      // Sync current time to DB when pausing
      updateSession('walking', localSeconds);
    }
    setIsActive(!isActive);
  };

  const handleFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    
    // Log the completion to simple_task_logs or a generic activity log
    if (session?.user?.id) {
      const { error } = await supabase.from('simple_task_logs').insert({
        user_id: session.user.id,
        value_at_completion: localSeconds,
        increased: false // Walking lab is currently time-based and doesn't auto-level yet
      });

      if (error) {
        console.error('Error logging walk:', error);
        toast.error("Couldn't save your walk to history.");
      } else {
        toast.success("Walk saved to your history!");
      }
    }

    audioManager.playSuccess();
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });
    await updateSession('complete', localSeconds);
  };

  const handleReset = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setLocalSeconds(0);
    await resetSession();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center mb-6">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Practice Lab</h2>
        <p className="text-lg font-bold text-white/60 uppercase tracking-widest">Robust Habit Building</p>
      </div>

      <Card className="w-full max-w-md bg-white/10 border-white/20 rounded-[3rem] overflow-hidden shadow-2xl">
        <CardContent className="p-10 space-y-8">
          {stage === 'outside' && (
            <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">Step 1: Get Out</h3>
                <p className="text-white/60 font-bold">The hardest part is just crossing the threshold.</p>
              </div>
              <div className="w-32 h-32 mx-auto bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl">
                <CloudSun className="w-16 h-16 text-orange-500" />
              </div>
              <Button 
                onClick={handleStepOutside}
                className="w-full h-24 text-2xl font-black rounded-[2.5rem] bg-white text-orange-500 hover:scale-105 transition-all"
              >
                I'M OUTSIDE!
              </Button>
            </div>
          )}

          {stage === 'walking' && (
            <div className="space-y-8 text-center animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase">Step 2: Move</h3>
                <p className="text-white/60 font-bold">Enjoy the air. No pressure on distance.</p>
              </div>
              
              <div className="text-7xl font-black text-white tabular-nums tracking-tighter">
                {formatTimeDisplay(localSeconds)}
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
                  className="flex-[2] h-20 text-xl font-black rounded-[2rem] bg-white text-orange-500"
                >
                  FINISH WALK
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
                <p className="text-sm font-black text-white/40 uppercase tracking-widest pt-4">
                  Total Time: {Math.floor(localSeconds / 60)}m {localSeconds % 60}s
                </p>
              </div>
              <Button 
                onClick={handleReset}
                variant="ghost"
                className="w-full h-12 text-white/40 hover:text-white font-black uppercase tracking-widest text-xs"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Start New Session
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