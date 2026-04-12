"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Anchor, Sparkles, Calendar, Info, 
  CheckCircle2, ChevronUp, ChevronDown, 
  Lightbulb, Heart 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TrialGuidanceProps {
  habitKey: string;
  habitName: string;
  isTrial: boolean;
  isAnchor: boolean;
  completionsInPlateau: number;
  plateauDaysRequired: number;
  dailyGoal: number;
  unit: string;
  frequency: number;
}

const guidancePrompts = [
  "Focus on just showing up today. That's the only win that matters.",
  "Consistency matters more than perfection. Even a partial session counts.",
  "You're building a foundation. Let it be easy and routine first.",
  "No pressure to grow yet. We're just making this habit 'boring' and familiar.",
  "Small, sustainable actions beat occasional heroics every time.",
];

export const TrialGuidance: React.FC<TrialGuidanceProps> = ({
  habitKey,
  habitName,
  isTrial,
  isAnchor,
  completionsInPlateau,
  plateauDaysRequired,
  dailyGoal,
  unit,
  frequency
}) => {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `trialGuidanceCollapsed:${habitKey}:${today}`;
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) === 'true';
    }
    return false;
  });

  const [promptIndex] = useState(() => Math.floor(Math.random() * guidancePrompts.length));

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(storageKey, String(newState));
  };

  const progress = Math.min(100, (completionsInPlateau / plateauDaysRequired) * 100);
  const isComplete = completionsInPlateau >= plateauDaysRequired;

  return (
    <Card className={cn(
      "border-2 rounded-[2rem] overflow-hidden transition-all duration-300 mb-6",
      isTrial ? "bg-info-background/10 border-info-border/40" : "bg-primary/[0.03] border-primary/10"
    )}>
      <div 
        className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center",
            isTrial ? "bg-info text-info-foreground" : "bg-primary text-primary-foreground"
          )}>
            {isTrial ? <Sparkles className="w-4 h-4" /> : <Anchor className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {isTrial ? "Trial Mode Guidance" : "Anchor Practice Support"}
            </h4>
            <p className="text-xs font-bold">
              {isTrial ? `Anchoring: ${completionsInPlateau}/${plateauDaysRequired} days` : "Keeping you grounded"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="p-5 pt-0 space-y-5">
              <div className="bg-card/50 rounded-2xl p-4 border border-border/50 space-y-4 shadow-inner">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Minimum Target</span>
                  <span>Commitment</span>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-black text-foreground">{Math.round(dailyGoal)} {unit}</p>
                  <p className="text-xs font-bold text-muted-foreground">{frequency} sessions / week</p>
                </div>
                
                {isTrial && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-info-foreground">Trial Progress</span>
                      <span>{completionsInPlateau} / {plateauDaysRequired} days</span>
                    </div>
                    <Progress value={progress} className="h-1.5 [&>div]:bg-info" />
                    <p className="text-[9px] font-bold text-muted-foreground leading-tight italic">
                      {isComplete 
                        ? "Trial complete! You're ready to transition to Adaptive Growth." 
                        : `${plateauDaysRequired - completionsInPlateau} more days of consistency until we suggest growth.`}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 px-1">
                <div className="bg-success-background p-2 rounded-xl shrink-0">
                  <Heart className="w-4 h-4 text-success" />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-success">Coach's Insight</p>
                  <p className="text-sm font-medium leading-relaxed italic">
                    "{guidancePrompts[promptIndex]}"
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-widest" onClick={toggleCollapse}>
                  Got it
                </Button>
                <Link to="/help" className="flex-1">
                  <Button variant="ghost" className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Learn Why
                  </Button>
                </Link>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Internal link helper for the button
import { Link } from 'react-router-dom';