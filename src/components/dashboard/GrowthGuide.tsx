"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GrowthGuide = () => {
  return (
    <Card className="border-2 border-primary/10 bg-muted/30 rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">How it Works</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Adaptive Growth is designed to meet you where you are, making habit building accessible and sustainable.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex gap-4">
            <div className={cn("rounded-2xl p-3 shrink-0 h-fit", "bg-habit-blue text-habit-blue-foreground")}>
              <Anchor className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Anchor Practices</h3>
              <p className="text-slate-300 font-medium leading-relaxed">
                Designate core habits that keep you grounded and consistent, even on chaotic days.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className={cn("rounded-2xl p-3 shrink-0 h-fit", "bg-habit-orange text-habit-orange-foreground")}>
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Trial Mode</h3>
              <p className="text-slate-300 font-medium leading-relaxed">
                Start new habits in a low-pressure phase, focusing on consistency until it feels routine.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className={cn("rounded-2xl p-3 shrink-0 h-fit", "bg-habit-green text-habit-green-foreground")}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Adaptive Growth</h3>
              <p className="text-slate-300 font-medium leading-relaxed">
                Your goals adjust dynamically to your actual progress, preventing burnout and ensuring sustainable growth.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};