"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, Loader2, Hourglass } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { formatDistanceToNowStrict, addMinutes, isPast } from 'date-fns';
import { showSuccess, showError } from '@/utils/toast';

interface RegenPodDialogProps {
  currentEnergy: number;
  maxEnergy: number;
  isInRegenPod: boolean;
  regenPodStartTime: Date | null;
  lastEnergyRegenAt: Date | null;
}

const ENERGY_REGEN_RATE_PER_MINUTE = 1; // Energy per minute outside pod
const REGEN_POD_RATE_MULTIPLIER = 2; // Multiplier for regen pod (e.g., 2x faster)

export const RegenPodDialog: React.FC<RegenPodDialogProps> = ({
  currentEnergy: initialEnergy,
  maxEnergy,
  isInRegenPod: initialIsInRegenPod,
  regenPodStartTime: initialRegenPodStartTime,
  lastEnergyRegenAt: initialLastEnergyRegenAt,
}) => {
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const [currentEnergy, setCurrentEnergy] = useState(initialEnergy);
  const [isInRegenPod, setIsInRegenPod] = useState(initialIsInRegenPod);
  const [regenPodStartTime, setRegenPodStartTime] = useState<Date | null>(initialRegenPodStartTime);
  const [lastEnergyRegenAt, setLastEnergyRegenAt] = useState<Date | null>(initialLastEnergyRegenAt);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateEnergy = useCallback((
    energy: number,
    inPod: boolean,
    podStartTime: Date | null,
    lastRegenTime: Date | null
  ) => {
    let calculatedEnergy = energy;
    let lastCalcTime = lastRegenTime || new Date(); // Use lastRegenTime or now if not set

    if (inPod && podStartTime) {
      // If in pod, regen starts from pod start time
      lastCalcTime = podStartTime;
    }

    const now = new Date();
    const minutesPassed = Math.floor((now.getTime() - lastCalcTime.getTime()) / (1000 * 60));
    
    if (minutesPassed > 0) {
      const rate = inPod ? ENERGY_REGEN_RATE_PER_MINUTE * REGEN_POD_RATE_MULTIPLIER : ENERGY_REGEN_RATE_PER_MINUTE;
      calculatedEnergy = Math.min(maxEnergy, energy + (minutesPassed * rate));
    }
    return calculatedEnergy;
  }, [maxEnergy]);

  // Effect to update energy when dialog opens or relevant props change
  useEffect(() => {
    const newEnergy = calculateEnergy(
      initialEnergy,
      initialIsInRegenPod,
      initialRegenPodStartTime,
      initialLastEnergyRegenAt
    );
    setCurrentEnergy(newEnergy);
    setIsInRegenPod(initialIsInRegenPod);
    setRegenPodStartTime(initialRegenPodStartTime);
    setLastEnergyRegenAt(initialLastEnergyRegenAt);
  }, [initialEnergy, initialIsInRegenPod, initialRegenPodStartTime, initialLastEnergyRegenAt, calculateEnergy]);

  // Timer for real-time energy regeneration display
  useEffect(() => {
    if (currentEnergy < maxEnergy) {
      intervalRef.current = setInterval(() => {
        setCurrentEnergy(prevEnergy => {
          const now = new Date();
          const lastCalcTime = lastEnergyRegenAt || now; // Use lastEnergyRegenAt for continuous regen
          const minutesPassed = Math.floor((now.getTime() - lastCalcTime.getTime()) / (1000 * 60));
          
          if (minutesPassed > 0) {
            const rate = isInRegenPod ? ENERGY_REGEN_RATE_PER_MINUTE * REGEN_POD_RATE_MULTIPLIER : ENERGY_REGEN_RATE_PER_MINUTE;
            const newEnergy = Math.min(maxEnergy, prevEnergy + (minutesPassed * rate));
            
            // Update lastEnergyRegenAt in state to reflect the new calculation point
            setLastEnergyRegenAt(now); 
            
            // Also update in DB if significant regen happened
            if (newEnergy !== prevEnergy) {
                updateProfile({ energy: newEnergy, last_energy_regen_at: now.toISOString() });
            }
            return newEnergy;
          }
          return prevEnergy;
        });
      }, 1000 * 60); // Check every minute
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentEnergy, maxEnergy, isInRegenPod, lastEnergyRegenAt, updateProfile]);


  const handleEnterRegenPod = () => {
    const now = new Date();
    const updates = {
      is_in_regen_pod: true,
      regen_pod_start_time: now.toISOString(),
      last_energy_regen_at: now.toISOString(), // Reset regen timer
      energy: currentEnergy, // Save current energy before entering
    };
    updateProfile(updates, {
      onSuccess: () => {
        setIsInRegenPod(true);
        setRegenPodStartTime(now);
        setLastEnergyRegenAt(now);
        showSuccess('Entered Regen Pod! Energy will regenerate faster.');
      },
      onError: (error) => showError(`Failed to enter Regen Pod: ${error.message}`),
    });
  };

  const handleExitRegenPod = () => {
    const now = new Date();
    const finalEnergy = calculateEnergy(currentEnergy, isInRegenPod, regenPodStartTime, lastEnergyRegenAt);
    const updates = {
      is_in_regen_pod: false,
      regen_pod_start_time: null,
      last_energy_regen_at: now.toISOString(), // Update last regen time on exit
      energy: finalEnergy, // Save final calculated energy
    };
    updateProfile(updates, {
      onSuccess: () => {
        setIsInRegenPod(false);
        setRegenPodStartTime(null);
        setLastEnergyRegenAt(now);
        setCurrentEnergy(finalEnergy);
        showSuccess('Exited Regen Pod. Energy regeneration rate is now normal.');
      },
      onError: (error) => showError(`Failed to exit Regen Pod: ${error.message}`),
    });
  };

  const energyPercentage = (currentEnergy / maxEnergy) * 100;
  const regenRate = isInRegenPod ? ENERGY_REGEN_RATE_PER_MINUTE * REGEN_POD_RATE_MULTIPLIER : ENERGY_REGEN_RATE_PER_MINUTE;
  const timeToFull = currentEnergy < maxEnergy ? Math.ceil((maxEnergy - currentEnergy) / regenRate) : 0;

  return (
    <DialogContent className="sm:max-w-[425px] rounded-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-purple-500" />
          <span>Energy & Regen Pod</span>
        </DialogTitle>
        <DialogDescription>
          Manage your energy levels. Tasks consume energy, and it regenerates over time.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Current Energy:</p>
          <p className="text-2xl font-bold text-purple-600">{currentEnergy}/{maxEnergy}</p>
        </div>
        <Progress value={energyPercentage} className="h-3 [&>div]:bg-purple-500" />

        {currentEnergy < maxEnergy && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Hourglass className="w-4 h-4" />
            <span>
              {isInRegenPod ? `Regenerating at ${regenRate} energy/min` : `Regenerating at ${regenRate} energy/min`}
              {timeToFull > 0 && ` • Full in ~${timeToFull} min`}
            </span>
          </div>
        )}

        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-700 dark:text-purple-300">Regen Pod Status:</h4>
          <p className="text-sm text-foreground mt-1">
            {isInRegenPod ? (
              <>
                You are currently in the Regen Pod. Energy regenerates {REGEN_POD_RATE_MULTIPLIER}x faster.
                {regenPodStartTime && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Entered {formatDistanceToNowStrict(regenPodStartTime, { addSuffix: true })}
                  </span>
                )}
              </>
            ) : (
              'You are outside the Regen Pod. Enter to accelerate energy regeneration.'
            )}
          </p>
        </div>
      </div>
      <DialogFooter>
        {isInRegenPod ? (
          <Button
            variant="destructive"
            onClick={handleExitRegenPod}
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Exit Regen Pod'}
          </Button>
        ) : (
          <Button
            onClick={handleEnterRegenPod}
            disabled={isUpdatingProfile || currentEnergy === maxEnergy}
          >
            {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter Regen Pod'}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};