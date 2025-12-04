"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { RegenPodDialog } from './RegenPodDialog'; // Import the new dialog component

interface EnergyDisplayCardProps {
  currentEnergy: number;
  maxEnergy: number;
  isInRegenPod: boolean;
  regenPodStartTime: Date | null;
  lastEnergyRegenAt: Date | null;
}

export const EnergyDisplayCard: React.FC<EnergyDisplayCardProps> = ({
  currentEnergy,
  maxEnergy,
  isInRegenPod,
  regenPodStartTime,
  lastEnergyRegenAt,
}) => {
  const energyPercentage = (currentEnergy / maxEnergy) * 100;

  return (
    <Card className="rounded-2xl shadow-sm bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-purple-700 dark:text-purple-300">
            <Zap className="w-6 h-6" />
            <h3 className="font-semibold text-lg">Energy</h3>
          </div>
          <p className="text-lg font-bold text-foreground">
            {currentEnergy}/{maxEnergy}
          </p>
        </div>
        <Progress value={energyPercentage} className="h-2 [&>div]:bg-purple-500" />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900">
              {isInRegenPod ? 'View Regen Pod' : 'Enter Regen Pod'}
            </Button>
          </DialogTrigger>
          <RegenPodDialog
            currentEnergy={currentEnergy}
            maxEnergy={maxEnergy}
            isInRegenPod={isInRegenPod}
            regenPodStartTime={regenPodStartTime}
            lastEnergyRegenAt={lastEnergyRegenAt}
          />
        </Dialog>
      </CardContent>
    </Card>
  );
};