"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Lightbulb, Target, Anchor, Zap, ShieldCheck, Brain, Clock, Layers,
  Trophy, Star, TrendingUp, Info, CheckCircle2, Calendar, Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  Edit2, Settings
} from 'lucide-react';
import { Switch } from '@/components/ui/switch'; // Corrected import for Switch
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const habitIconMap: Record<string, React.ElementType> = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home,
  projectwork: Code,
  teeth_brushing: Sparkles,
  medication: Pill,
};

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
              <Anchor className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-sm">Anchor Practices</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-sm">Daily Momentum</span>
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
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Trial Mode (Anchoring)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  This is where new habits begin. The focus is purely on showing up consistently, not on increasing intensity or duration. The system tracks your consistency over a set period (e.g., 7 days) to ensure the habit feels routine before suggesting growth.
                </p>
              </div>
            </div>

            {/* Adaptive Growth Mode */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Adaptive Growth Mode</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Once a habit is anchored, the system will suggest small, adaptive increments to your daily goal (duration or reps) or frequency. If you struggle, growth pauses automatically to prevent overwhelm. This ensures sustainable progress.
                </p>
              </div>
            </div>

            {/* Fixed (Maintenance) Mode */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Fixed (Maintenance) Mode</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  For habits like "Brush Teeth" where the ideal goal is already known and doesn't need to increase. The system focuses on maintaining consistency without any goal adjustments.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capsules / Chunking Section */}
      <Card className="rounded-3xl shadow-sm border-0">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <Layers className="w-5 h-5 text-primary" />
            Capsules & Chunking: Breaking Down Your Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            To make large goals less daunting, the app can break your habit sessions into smaller, manageable "capsules" or chunks.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Adaptive Auto-Chunking</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  When enabled, the app automatically suggests breaking your daily habit goal into smaller parts. For example, a 30-minute meditation might become three 10-minute capsules. This is especially helpful in Neurodivergent Mode.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="p-2 rounded-lg bg-background text-muted-foreground shrink-0">
                <Edit2 className="w-5 h-5" /> {/* Using Edit2 for manual */}
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Manual Chunking (Advanced)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  You can manually configure the number of chunks and their duration in the habit settings. This gives you full control over how your sessions are broken down.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP / Gamification Section */}
      <Card className="rounded-3xl shadow-sm border-0">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <Trophy className="w-5 h-5 text-primary" />
            XP & Gamification: Level Up Your Life
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Stay motivated with a gamified progress system that rewards your consistency and effort.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-yellow-50/50 border border-yellow-100">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Experience Points (XP) & Levels</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Every completed habit session earns you XP. Accumulate enough XP to level up, unlocking new insights and celebrating your journey. Your current level and XP progress are visible on the dashboard.
                </p>
                <div className="mt-3">
                  <Progress value={75} className="h-2 [&>div]:bg-yellow-500" />
                  <p className="text-xs text-muted-foreground mt-1">Example: 75% to next level</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Daily Streaks & Badges</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Maintain consistency to build your daily streak. Achieve specific milestones (like a 7-day streak or 100 push-ups) to earn special badges, recognizing your dedication.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings / Customization Section */}
      <Card className="rounded-3xl shadow-sm border-0">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <Settings className="w-5 h-5 text-primary" />
            Settings & Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Tailor the app to fit your unique lifestyle and preferences.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Neurodivergent Mode</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  This mode optimizes the app for neurodivergent individuals by enabling smaller habit increments, longer stabilization plateaus, and modular task capsules to reduce overwhelm and support consistent engagement.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Switch checked={true} disabled /> <span className="text-xs text-muted-foreground">Example: Enabled</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Time Windows & Frequency</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Set specific days of the week and time windows for each habit. This helps the app suggest tasks when you're most likely to complete them, aligning with your natural energy cycles.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="p-2 rounded-lg bg-background text-muted-foreground shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Growth Thresholds & Visibility</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Customize how many days of consistency are required before a habit's goal increases. You can also toggle habit visibility on your dashboard without losing progress.
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
            <li><strong>Embrace Trial Mode:</strong> Don't rush growth. Let habits become routine and "boring" first.</li>
            <li><strong>Listen to Your Body:</strong> The adaptive system will pause growth if you struggle. Trust the process.</li>
            <li><strong>Use Time Windows:</strong> Schedule habits during your peak energy times for better success.</li>
            <li><strong>No Judgment:</strong> Focus on showing up. Every session, no matter how small, is a win.</li>
            <li><strong>Review Your History:</strong> Use the History page to see your progress and identify patterns.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;