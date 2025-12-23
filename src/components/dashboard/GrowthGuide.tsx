"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Anchor, Zap, ShieldCheck } from 'lucide-react';

export const GrowthGuide = () => {
  return (
    <Card className="border-2 border-primary/10 bg-muted/30 rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="font-black text-lg uppercase tracking-tight">Growth Philosophy</h3>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">How your habits evolve</p>
        </div>

        <div className="grid gap-4">
          <div className="flex gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-2xl p-3 shrink-0 h-fit">
              <Anchor className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm uppercase">Trial Mode (Anchoring)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Start here. No pressure to grow. Your only job is to show up for your weekly sessions until it feels routine.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-2xl p-3 shrink-0 h-fit">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm uppercase">Adaptive Growth</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Once stabilized, the app suggests tiny increments. If you struggle, it pauses growth automatically to prevent burnout.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-2xl p-3 shrink-0 h-fit">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm uppercase">Maintenance (Fixed)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For habits like "Brush Teeth" where the goal is perfect as it is. No changes, just consistency.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};