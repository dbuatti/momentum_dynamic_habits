"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Lightbulb, Target, Anchor, Zap, ShieldCheck, Brain, Clock, Layers,
  Trophy, Star, TrendingUp, Info, CheckCircle2, Calendar, Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  Edit2, Settings, Compass
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const HelpPage = () => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title="Growth Guide" backLink="/" />

      {/* Landing / Intro Section */}
      <Card className="rounded-3xl shadow-sm border-0 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Welcome to Your Adaptive Growth Journey!</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            This guide explains how your Adaptive Growth Coach works. We focus on building sustainable habits through small, consistent actions, adapting to your unique pace and needs.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-info" />
              <span className="font-semibold text-sm">Anchor Practices</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              <span className="font-semibold text-sm">Daily Momentum</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Lab Section */}
      <Card className="rounded-3xl shadow-sm border-2 border-primary/20">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <Compass className="w-5 h-5 text-primary" />
            The Practice Lab: Designing Your Habits
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            The **Practice Lab** is where you build your routines. You can choose two paths to design a new habit:
          </p>

          <div className="grid gap-4">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
              <h4 className="font-bold text-sm uppercase mb-1">1. Guided Setup</h4>
              <p className="text-xs text-muted-foreground">A multi-step interview where the coach helps you identify energy costs, emotional barriers, and timing fits to build a habit that actually sticks.</p>
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <h4 className="font-bold text-sm uppercase mb-1">2. AI Quick Build</h4>
              <p className="text-xs text-muted-foreground">Describe your goal in plain English (e.g., "I want to exercise for 10 minutes after work") and let the AI instantly configure the logic and schedule for you.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Habit Modes Section */}
      <Card className="rounded-3xl shadow-sm border-0">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <Target className="w-5 h-5 text-primary" />
            Habit Modes: How Your Habits Evolve
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Your habits progress through different modes, each designed to support your growth without burnout.
          </p>

          <div className="space-y-4">
            {/* Trial Mode */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-info-background/50 border border-info-border/50">
              <div className="p-2 rounded-lg bg-info-background text-info shrink-0">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Trial Mode (Anchoring)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  This is where new habits begin. The focus is purely on showing up consistently, not on increasing intensity or duration.
                </p>
              </div>
            </div>

            {/* Adaptive Growth Mode */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-warning-background/50 border border-warning-border/50">
              <div className="p-2 rounded-lg bg-warning-background text-warning shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Adaptive Growth Mode</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Once stable, the system suggests small increments to your goal. If you struggle, growth pauses automatically to prevent overwhelm.
                </p>
              </div>
            </div>

            {/* Fixed Mode */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-success-background/50 border border-success-border/50">
              <div className="p-2 rounded-lg bg-success-background text-success shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Fixed (Maintenance) Mode</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  For habits where the ideal goal is already known and doesn't need to increase. Focuses purely on consistency.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips / Best Practices Section */}
      <Card className="rounded-3xl shadow-sm border-0">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <Info className="w-5 h-5 text-primary" />
            Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong>Start Small:</strong> Begin with 1-2 habits in Trial Mode to build a solid foundation.</li>
            <li><strong>Use the Lab:</strong> Let the Practice Lab interview help you identify why you might fail before you even start.</li>
            <li><strong>Listen to Your Body:</strong> The adaptive system will pause growth if you struggle. Trust the process.</li>
            <li><strong>No Judgment:</strong> Focus on showing up. Every session, no matter how small, is a win.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;