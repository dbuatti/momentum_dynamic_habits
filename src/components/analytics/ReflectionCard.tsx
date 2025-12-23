"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { useCreateReflection } from '@/hooks/useCreateReflection';
import { format, isSameDay } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ReflectionCardProps {
  prompt: string;
  initialNotes: string | null;
  lastReflectionDate: string | null;
  xpBonusAwarded: boolean;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  prompt,
  initialNotes,
  lastReflectionDate,
  xpBonusAwarded,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notes, setNotes] = useState(initialNotes || '');
  const { mutate: createReflection, isPending } = useCreateReflection();

  const today = format(new Date(), 'yyyy-MM-dd');
  const hasReflectedToday = lastReflectionDate ? isSameDay(new Date(lastReflectionDate), new Date()) : false;
  const isXpAwardedToday = hasReflectedToday && xpBonusAwarded;

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  const handleSubmit = () => {
    createReflection({ prompt, notes });
  };

  // Theme-aware colors
  const cardBg = isDark ? "bg-[hsl(var(--habit-purple))]/20" : "bg-[hsl(var(--habit-purple))]";
  const cardBorder = isDark ? "border-[hsl(var(--habit-purple-border))]" : "border-[hsl(var(--habit-purple-border))]";
  const cardText = isDark ? "text-[hsl(var(--habit-purple-foreground))]" : "text-[hsl(var(--habit-purple-foreground))]";
  const textareaBorder = isDark ? "border-[hsl(var(--habit-purple-border))]" : "border-[hsl(var(--habit-purple-border))]";
  const buttonBg = isDark ? "bg-[hsl(var(--habit-purple-foreground))] hover:bg-[hsl(var(--habit-purple-foreground))]/90" : "bg-[hsl(var(--habit-purple-foreground))] hover:bg-[hsl(var(--habit-purple-foreground))]/90";

  return (
    <Card className={cn("rounded-2xl shadow-sm border-0", cardBg, cardBorder)}>
      <CardHeader className="p-5 pb-3">
        <CardTitle className={cn("font-semibold text-lg flex items-center", cardText)}>
          <Lightbulb className="w-5 h-5 mr-2" />
          Weekly Reflection
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <p className={cn("text-sm font-medium leading-relaxed", cardText)}>
          {prompt}
        </p>
        <Textarea
          placeholder="Write your thoughts here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={cn("min-h-[100px] rounded-xl", textareaBorder)}
          disabled={isPending}
        />
        <Button
          className={cn("w-full rounded-xl", buttonBg, cardText)}
          onClick={handleSubmit}
          disabled={isPending || notes.trim().length === 0}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <MessageSquare className="w-5 h-5 mr-2" />
              {hasReflectedToday ? 'Update Reflection' : 'Save Reflection'}
            </>
          )}
        </Button>
        {isXpAwardedToday && (
          <div className={cn("flex items-center justify-center text-sm font-medium mt-3", isDark ? "text-[hsl(var(--habit-green-foreground))]" : "text-[hsl(var(--habit-green-foreground))]")}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            XP bonus already awarded for today's reflection!
          </div>
        )}
      </CardContent>
    </Card>
  );
};