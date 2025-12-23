"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor, Zap, ShieldCheck, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const GrowthGuide = () => {
  return (
    <Card className="border-2 border-primary/10 bg-muted/30 rounded-3xl overflow-hidden">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="growth-guide-overview" className="border-b-0">
          <AccordionTrigger className="px-6 py-5 hover:no-underline group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground text-left">How Adaptive Growth Works</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0 space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Adaptive Growth is designed to meet you where you are, making habit building accessible and sustainable.
            </p>

            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className={cn("rounded-2xl p-3 shrink-0 h-fit", "bg-info text-info-foreground")}>
                  <Anchor className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">Anchor Practices</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                    Designate core habits that keep you grounded and consistent, even on chaotic days.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className={cn("rounded-2xl p-3 shrink-0 h-fit", "bg-warning text-warning-foreground")}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">Trial Mode</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                    Start new habits in a low-pressure phase, focusing on consistency until it feels routine.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className={cn("rounded-2xl p-3 shrink-0 h-fit", "bg-success text-success-foreground")}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">Adaptive Growth</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                    Your goals adjust dynamically to your actual progress, preventing burnout and ensuring sustainable growth.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};