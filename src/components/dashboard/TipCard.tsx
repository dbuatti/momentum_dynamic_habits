import { Lightbulb, Music, Dumbbell, Wind, BookOpen } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TipCardProps {
  tip: {
    content: string;
    related_habit_key: string | null;
  } | null;
}

const habitIconMap: { [key: string]: React.ElementType } = {
  piano: Music,
  meditation: Wind,
  pushups: Dumbbell,
  kinesiology: BookOpen,
};

export const TipCard: React.FC<TipCardProps> = ({ tip }) => {
  if (!tip) {
    return null;
  }

  const RelatedIcon = tip.related_habit_key ? habitIconMap[tip.related_habit_key] : null;
  const relatedHabitName = tip.related_habit_key 
    ? tip.related_habit_key.charAt(0).toUpperCase() + tip.related_habit_key.slice(1) 
    : null;

  return (
    <Card className="bg-habit-purple border border-habit-purple-border rounded-2xl shadow-sm border-0">
      <CardContent className="p-5">
        <div className="flex items-start space-x-3">
          <div className="bg-white rounded-full p-2 mt-0.5">
            <Lightbulb className="w-5 h-5 text-habit-purple-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-habit-purple-foreground">Today's tip</h4>
            <p className="text-foreground mt-1">{tip.content}</p>
            {RelatedIcon && relatedHabitName && (
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground mt-2">
                <RelatedIcon className="w-3 h-3" />
                <span>Working on: {relatedHabitName}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};