import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Zap } from 'lucide-react';
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
  const progressPercentage = xpNeededForNextLevel > 0 
    ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 
    : 0;

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-yellow-700 dark:text-yellow-300">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-2">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center">
                <Zap className="w-4 h-4 mr-1.5" />
                Level {currentLevel}
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {xpProgressInCurrentLevel}/{xpNeededForNextLevel} XP to next
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {currentXp} <span className="text-base font-normal">XP</span>
          </p>
        </div>
        
        <div className="mt-4">
          <Progress value={progressPercentage} className="h-3 [&>div]:bg-yellow-500" />
          <p className="text-sm text-muted-foreground text-right mt-2">
            {xpNeededForNextLevel - xpProgressInCurrentLevel} XP to next level
          </p>
        </div>
      </CardContent>
    </Card>
  );
};