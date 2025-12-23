import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Zap } from 'lucide-react';
import { getXpForNextLevel, getXpForCurrentLevelStart } from '@/utils/leveling';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface LevelProgressCardProps {
  currentXp: number;
  currentLevel: number;
}

export const LevelProgressCard: React.FC<LevelProgressCardProps> = ({ currentXp, currentLevel }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const xpForCurrentLevelStart = getXpForCurrentLevelStart(currentLevel);
  const xpForNextLevel = getXpForNextLevel(currentLevel);
  
  // Ensure XP progress is non-negative
  const xpProgressInCurrentLevel = Math.max(0, currentXp - xpForCurrentLevelStart);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevelStart;
  
  const progressPercentage = xpNeededForNextLevel > 0 
    ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 
    : 0;
    
  const xpRemaining = Math.max(0, xpNeededForNextLevel - xpProgressInCurrentLevel);

  // Theme-aware gradient and colors
  const cardBg = isDark 
    ? "bg-gradient-to-r from-yellow-950 to-orange-950" 
    : "bg-gradient-to-r from-yellow-50 to-orange-50";
  const cardBorder = "border-yellow-200 dark:border-yellow-800";
  const iconBg = isDark ? "bg-yellow-900/30" : "bg-yellow-100";
  const iconText = "text-yellow-700 dark:text-yellow-300";
  const headerText = "text-[hsl(var(--foreground))]";
  const subText = isDark ? "text-yellow-400" : "text-yellow-600";
  const progressColor = "[&>div]:bg-yellow-500";
  const remainingText = "text-[hsl(var(--muted-foreground))]";

  return (
    <Card className={cn("rounded-2xl shadow-sm border-0", cardBg, cardBorder)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center space-x-3", iconText)}>
            <div className={cn("rounded-full p-2", iconBg)}>
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className={cn("font-semibold text-lg flex items-center", headerText)}>
                <Zap className="w-4 h-4 mr-1.5" />
                Level {currentLevel}
              </h3>
              <p className={cn("text-sm", subText)}>
                {xpProgressInCurrentLevel}/{xpNeededForNextLevel} XP to next
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {currentXp} <span className="text-base font-normal">XP</span>
          </p>
        </div>
        
        <div className="mt-4">
          <Progress value={progressPercentage} className={cn("h-3", progressColor)} />
          <p className={cn("text-sm text-right mt-2", remainingText)}>
            {xpRemaining} XP to next level
          </p>
        </div>
      </CardContent>
    </Card>
  );
};