"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { useCreateReflection } from '@/hooks/useCreateReflection';
import { format, isSameDay } from 'date-fns';

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

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-purple-50/50 border-purple-100">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold text-lg flex items-center text-purple-700">
          <Lightbulb className="w-5 h-5 mr-2" />
          Weekly Reflection
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <p className="text-sm text-purple-800 font-medium leading-relaxed">
          {prompt}
        </p>
        <Textarea
          placeholder="Write your thoughts here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px] rounded-xl border-purple-200 focus-visible:ring-purple-500"
          disabled={isPending}
        />
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
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
          <div className="flex items-center justify-center text-green-600 text-sm font-medium mt-3">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            XP bonus already awarded for today's reflection!
          </div>
        )}
      </CardContent>
    </Card>
  );
};