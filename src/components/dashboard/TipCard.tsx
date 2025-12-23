import { Lightbulb, Music, Dumbbell, Wind, BookOpen, Code, Home, Heart, Sparkles, Zap } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  // Theme-aware color classes
  const cardBg = "bg-[hsl(var(--habit-purple))]/30";
  const cardBorder = "border-2 border-[hsl(var(--habit-purple-border))]/50";
  const iconBg = "bg-[hsl(var(--habit-purple-border))]/30";
  const iconText = "text-[hsl(var(--habit-purple-foreground))]";
  const headerText = "text-[hsl(var(--habit-purple-foreground))]";
  const bodyText = "text-[hsl(var(--foreground))]";
  const subText = "text-[hsl(var(--habit-purple-foreground))]/70";
  const italicText = "text-[hsl(var(--muted-foreground))]";

  return (
    <Card className={cn("overflow-hidden", cardBg, cardBorder)}>
      <CardContent className="p-5 relative">
        <div className="flex items-start gap-4">
          <div className={cn("rounded-xl p-3 shrink-0", iconBg, iconText)}>
            {isNeurodivergent ? <Heart className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <h4 className={cn("font-bold text-xs uppercase tracking-widest flex items-center gap-1.5", headerText)}>
              {isNeurodivergent ? "Compassion Boost" : "Daily Insight"}
            </h4>
            <p className={cn("text-sm font-medium leading-relaxed", bodyText)}>
              {displayTip}
            </p>
            {workingOn && (
              <p className={cn("text-[10px] font-bold mt-1", subText)}>
                Keep focusing on: {workingOn}
              </p>
            )}
            {isNeurodivergent && (
              <p className={cn("text-[10px] italic mt-2", italicText)}>
                "Progress over perfection."
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};