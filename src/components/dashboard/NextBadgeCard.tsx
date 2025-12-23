import { Progress } from '@/components/ui/progress';
import { Flame, Star, Trophy, Dumbbell, Wind, Shield, Crown, Mountain } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  if (!badge) {
    return (
      <Card className="bg-success-background border border-success-border rounded-2xl shadow-sm border-0">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="bg-success-background/50 rounded-full p-3">
              <Trophy className="w-6 h-6 text-success" />
            </div>
            <div className="flex-grow">
              <p className="font-semibold text-success-foreground">All badges unlocked!</p>
              <p className="text-sm text-success-foreground/80">You are a true champion.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = iconMap[badge.icon_name] || Flame;
  
  return (
    <Card className="bg-warning-background border border-warning-border rounded-2xl shadow-sm border-0">
      <CardContent className="p-5">
        <div className="flex items-center space-x-4">
          <div className="bg-warning-background/50 rounded-full p-3">
            <Icon className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-grow">
            <p className="text-sm text-muted-foreground flex items-center">
              <Star className="w-3.5 h-3.5 mr-1" />
              Next badge
            </p>
            <p className="font-semibold">{badge.name}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Progress 
                value={badge.progress.progressValue} 
                className="h-2 flex-grow [&>div]:bg-warning" 
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                <span className="font-semibold text-warning-foreground">{badge.progress.value}</span> {badge.progress.unit}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};