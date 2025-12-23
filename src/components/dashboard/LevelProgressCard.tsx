import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Zap } from 'lucide-react';
import { getXpForNextLevel, getXpForCurrentLevelStart } from '@/utils/leveling';
import { cn } from '@/lib/utils';

interface LevelProgressCardProps {
  currentXp: number;
  currentLevel: number;
}

export const LevelProgressCard: React.FC<LevelProgressCardProps> = ({ currentXp, currentLevel }) => {
  const xpForCurrentLevelStart = getXpForCurrentLevelStart(currentLevel);
  const xpForNextLevel = getXpForNextLevel(currentLevel);
  
  // Ensure XP progress is non-negative
  const xpProgressInCurrentLevel = Math.max(0, currentXp - xpForCurrentLevelStart);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevelStart;
  
  const progressPercentage = xpNeededForNextLevel > 0 
    ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 
    : 0;
    
  const xpRemaining = Math.max(0, xpNeededForNextLevel - xpProgressInCurrentLevel);

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-r from-warning-background/50 to-warning-background/20 dark:from-warning-background/30 dark:to-warning-background/10 border-warning-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-warning-foreground">
            <div className="bg-warning-background/50 dark:bg-warning-background/30 rounded-full p-2">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center">
                <Zap className="w-4 h-4 mr-1.5" />
                Level {currentLevel}
              </h3>
              <p className="text-sm text-warning-foreground/80">
                {xpProgressInCurrentLevel}/{xpNeededForNextLevel} XP to next
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {currentXp} <span className="text-base font-normal">XP</span>
          </p>
        </div>
        
        <div className="mt-4">
          <Progress value={progressPercentage} className="h-3 [&>div]:bg-warning" />
          <p className="text-sm text-muted-foreground text-right mt-2">
            {xpRemaining} XP to next level
          </p>
        </div>
      </CardContent>
    </Card>
  );
};