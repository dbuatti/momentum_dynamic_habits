import { Progress } from '@/components/ui/progress';
import { Flame, Star, Trophy, Dumbbell, Wind, Shield, Crown, Mountain } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const iconMap: { [key: string]: React.ElementType } = {
  Flame,
  Star,
  Trophy,
  Dumbbell,
  Wind,
  Shield,
  Crown,
  Mountain,
};

interface NextBadgeCardProps {
  badge: {
    name: string;
    icon_name: string;
    progress: {
      progressValue: number;
      value: number;
      unit: string;
    };
  } | null;
}

export const NextBadgeCard: React.FC<NextBadgeCardProps> = ({ badge }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!badge) {
    return (
      <Card className={cn(
        "rounded-2xl shadow-sm border-0",
        isDark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"
      )}>
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className={cn("rounded-full p-3", isDark ? "bg-green-800" : "bg-green-100")}>
              <Trophy className={cn("w-6 h-6", isDark ? "text-green-400" : "text-green-500")} />
            </div>
            <div className="flex-grow">
              <p className="font-semibold">All badges unlocked!</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">You are a true champion.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = iconMap[badge.icon_name] || Flame;
  
  return (
    <Card className={cn(
      "rounded-2xl shadow-sm border-0",
      isDark ? "bg-orange-900/20 border-orange-800" : "bg-orange-50 border-orange-200"
    )}>
      <CardContent className="p-5">
        <div className="flex items-center space-x-4">
          <div className={cn("rounded-full p-3", isDark ? "bg-orange-800" : "bg-orange-100")}>
            <Icon className={cn("w-6 h-6", isDark ? "text-orange-400" : "text-orange-500")} />
          </div>
          <div className="flex-grow">
            <p className={cn("text-sm font-bold flex items-center", isDark ? "text-orange-400" : "text-orange-600")}>
              <Star className="w-3.5 h-3.5 mr-1" />
              Next badge
            </p>
            <p className="font-semibold">{badge.name}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Progress 
                value={badge.progress.progressValue} 
                className={cn("h-2 flex-grow", "[&>div]:bg-orange-400")} 
              />
              <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                <span className={cn("font-semibold", isDark ? "text-orange-400" : "text-orange-600")}>{badge.progress.value}</span> {badge.progress.unit}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};