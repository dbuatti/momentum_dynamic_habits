"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export const GrowthGuide = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware color classes
  const sectionClasses = (colorKey: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: {
        bg: "bg-[hsl(var(--habit-blue))]",
        text: "text-[hsl(var(--habit-blue-foreground))]"
      },
      orange: {
        bg: "bg-[hsl(var(--habit-orange))]",
        text: "text-[hsl(var(--habit-orange-foreground))]"
      },
      green: {
        bg: "bg-[hsl(var(--habit-green))]",
        text: "text-[hsl(var(--habit-green-foreground))]"
      }
    };
    return colorMap[colorKey];
  };

  return (
    <Card className="border-2 border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--foreground))] tracking-tighter">How it Works</h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Adaptive Growth is designed to meet you where you are, making habit building accessible and sustainable.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex gap-4">
            <div className={cn("rounded-2xl p-3 shrink-0 h-fit", sectionClasses("blue").bg, sectionClasses("blue").text)}>
              <Anchor className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[hsl(var(--foreground))] mb-3 uppercase tracking-tight">Anchor Practices</h3>
              <p className="text-[hsl(var(--muted-foreground))] font-medium leading-relaxed">
                Designate core habits that keep you grounded and consistent, even on chaotic days.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className={cn("rounded-2xl p-3 shrink-0 h-fit", sectionClasses("orange").bg, sectionClasses("orange").text)}>
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[hsl(var(--foreground))] mb-3 uppercase tracking-tight">Trial Mode</h3>
              <p className="text-[hsl(var(--muted-foreground))] font-medium leading-relaxed">
                Start new habits in a low-pressure phase, focusing on consistency until it feels routine.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className={cn("rounded-2xl p-3 shrink-0 h-fit", sectionClasses("green").bg, sectionClasses("green").text)}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[hsl(var(--foreground))] mb-3 uppercase tracking-tight">Adaptive Growth</h3>
              <p className="text-[hsl(var(--muted-foreground))] font-medium leading-relaxed">
                Your goals adjust dynamically to your actual progress, preventing burnout and ensuring sustainable growth.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};