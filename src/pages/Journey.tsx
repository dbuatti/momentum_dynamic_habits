import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Journey = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 bg-background">
      <Link to="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      <div className="mt-12 w-full max-w-lg mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground text-center">Your Growth Journey</h1>
        
        {/* Actionable Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Actionable Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
                Insight Action Prompt (Option A): The app identifies a high-performance window (e.g., Tuesday mornings) and suggests an action.
            </p>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 rounded-md">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                    Double Down Nudge: You crushed Meditation last Tuesday at 9 AM. Try a 10-minute session right now!
                </p>
            </div>
          </CardContent>
        </Card>

        {/* Badges and Gamification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
                <Trophy className="w-5 h-5 text-primary" />
                <span>Badges & Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Next Badge Preview: Complete 7 days of Kinesiology Study to unlock the 'Focused Starter' badge.
            </p>
            <Button variant="outline" className="w-full">
                Use Streak Freeze (3 remaining)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Journey;