"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';
import { getLevelXpStats } from '@/utils/habit-leveling';
import { Dumbbell, Timer, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitLevelBarsProps {
  tasks: any[];
}

const taskIconMap: Record<string, any> = {
  'Push-ups': Dumbbell,
  'Be Still': Target,
  'Screen Break': Timer,
};

export const HabitLevelBars: React.FC<HabitLevelBarsProps> = ({ tasks }) => {
  // Filter for specific tasks requested by the user
  const masteryTasks = tasks.filter(t => 
    ['Push-ups', 'Be Still', 'Screen Break'].includes(t.task.name)
  );

  return (
    <Card className="rounded-[2rem] border-0 shadow-xl shadow-background/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Mastery Board
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-8">
        {masteryTasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 italic">Complete your central tasks to see mastery progress.</p>
        ) : (
          masteryTasks.map((summary) => {
            const task = summary.task;
            const Icon = taskIconMap[task.name] || Zap;
            const stats = getLevelXpStats(task.habit_xp || 0);
            const progress = (stats.xpInLevel / stats.xpNeededForNext) * 100;

            return (
              <div key={task.id} className="space-y-3 group">
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg uppercase tracking-tight leading-none">{task.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Rank: {task.habit_level > 10 ? 'Master' : task.habit_level > 5 ? 'Adept' : 'Novice'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-primary">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-2xl font-black italic leading-none">LVL {task.habit_level || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Experience Points</span>
                    <span className="text-[10px] font-black tabular-nums">
                      {Math.round(stats.xpInLevel)} / {stats.xpNeededForNext} XP
                    </span>
                  </div>
                  <div className="relative h-3 w-full bg-secondary rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};