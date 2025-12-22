import { Lightbulb, Music, Dumbbell, Wind, BookOpen, Code, Home, Heart, Sparkles, Zap } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TipCardProps {
  tip: {
    content: string;
    related_habit_key: string | null;
  } | null;
  bestTime?: string;
  workingOn?: string;
  isNeurodivergent?: boolean;
}

const habitIconMap: { [key: string]: React.ElementType } = {
  piano: Music,
  meditation: Wind,
  pushups: Dumbbell,
  kinesiology: BookOpen,
  housework: Home,
  projectwork: Code,
};

export const TipCard: React.FC<TipCardProps> = ({ tip, bestTime, workingOn, isNeurodivergent }) => {
  if (!tip && !bestTime) {
    return null;
  }

  const RelatedIcon = tip?.related_habit_key ? habitIconMap[tip.related_habit_key] : null;
  
  // Pattern-based tip if bestTime exists
  const patternTip = bestTime && bestTime !== '—' 
    ? `Your energy peaks during the ${bestTime.toLowerCase()}. Try tackling your hardest chunks then!` 
    : null;

  const displayTip = tip?.content || patternTip;
  const displayIcon = RelatedIcon || (bestTime ? Zap : Sparkles);

  return (
    <Card className="bg-habit-purple/30 border-2 border-habit-purple-border/50 rounded-2xl shadow-sm overflow-hidden">
      <CardContent className="p-5 relative">
        <div className="flex items-start gap-4">
          <div className="bg-habit-purple-border/30 rounded-xl p-3 shrink-0">
            {isNeurodivergent ? <Heart className="w-5 h-5 text-habit-purple-foreground" /> : <Lightbulb className="w-5 h-5 text-habit-purple-foreground" />}
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-widest text-habit-purple-foreground flex items-center gap-1.5">
              {isNeurodivergent ? "Compassion Boost" : "Daily Insight"}
            </h4>
            <p className="text-sm font-medium leading-relaxed">
              {displayTip}
            </p>
            {workingOn && (
              <p className="text-[10px] font-bold text-habit-purple-foreground/70 uppercase mt-1">
                Keep focusing on: {workingOn}
              </p>
            )}
            {isNeurodivergent && (
              <p className="text-[10px] italic text-muted-foreground mt-2">
                "Progress over perfection."
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};