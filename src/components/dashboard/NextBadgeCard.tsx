import { Progress } from '@/components/ui/progress';
import { Flame, Star } from 'lucide-react';
import React from 'react';

const iconMap: { [key: string]: React.ElementType } = { Flame, Star };

interface NextBadgeCardProps {
  badge: {
    name: string;
    icon_name: string;
  } | null;
}

export const NextBadgeCard: React.FC<NextBadgeCardProps> = ({ badge }) => {
  if (!badge) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
        <div className="bg-green-100 rounded-full p-2">
          <Star className="w-6 h-6 text-green-500" />
        </div>
        <div className="flex-grow">
          <p className="font-semibold">All badges unlocked!</p>
          <p className="text-sm text-muted-foreground">You are a true champion.</p>
        </div>
      </div>
    );
  }

  const Icon = iconMap[badge.icon_name] || Flame;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
      <div className="bg-orange-100 rounded-full p-2">
        <Icon className="w-6 h-6 text-orange-500" />
      </div>
      <div className="flex-grow">
        <p className="text-sm text-muted-foreground">Next badge</p>
        <p className="font-semibold">{badge.name}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Progress value={66} className="h-1.5 [&>div]:bg-orange-400" />
          <p className="text-sm font-semibold text-orange-600">3 <span className="font-normal text-muted-foreground">days left</span></p>
        </div>
      </div>
    </div>
  );
};