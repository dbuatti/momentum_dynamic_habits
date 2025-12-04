"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import { getXpForNextLevel, getXpForCurrentLevelStart } from '@/utils/leveling';

interface LevelProgressCardProps {
  currentXp: number;
  currentLevel: number;
}

export const LevelProgressCard: React.FC<LevelProgressCardProps> = ({ currentXp, currentLevel }) => {
  const xpForCurrentLevelStart = getXpForCurrentLevelStart(currentLevel);
  const xpForNextLevel = getXpForNextLevel(currentLevel);
  
  const xpProgressInCurrentLevel = currentXp - xpForCurrentLevelStart;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevelStart;

  const progressPercentage = xpNeededForNextLevel > 0 ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 : 0;

  return (
    <Card className="rounded-2xl shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-yellow-700 dark:text-yellow-300">
            <Star className="w-6 h-6" />
            <h3 className="font-semibold text-lg">Level {currentLevel}</h3>
          </div>
          <p className="text-lg font-bold text-foreground">
            {currentXp} XP
          </p>
        </div>
        <Progress value={progressPercentage} className="h-2 [&>div]:bg-yellow-500" />
        <p className="text-sm text-muted-foreground text-right">
          {xpNeededForNextLevel - xpProgressInCurrentLevel} XP to next level
        </p>
      </CardContent>
    </Card>
  );
};