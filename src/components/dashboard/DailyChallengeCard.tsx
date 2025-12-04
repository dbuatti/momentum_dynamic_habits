import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle } from 'lucide-react';
import React from 'react';

interface DailyChallengeCardProps {
  tasksCompletedToday: number;
  dailyChallengeTarget: number;
}

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({ tasksCompletedToday, dailyChallengeTarget }) => {
  const isChallengeComplete = tasksCompletedToday >= dailyChallengeTarget;
  const progressValue = dailyChallengeTarget > 0 ? (tasksCompletedToday / dailyChallengeTarget) * 100 : 0;

  return (
    <Card className="rounded-2xl shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center space-x-3 text-blue-700 dark:text-blue-300">
          {isChallengeComplete ? <CheckCircle className="w-6 h-6" /> : <Target className="w-6 h-6" />}
          <h3 className="font-semibold text-lg">Daily Challenge</h3>
        </div>
        <p className="text-foreground text-sm">
          {isChallengeComplete
            ? "Challenge complete! Great work today."
            : `Complete ${dailyChallengeTarget - tasksCompletedToday} more task${dailyChallengeTarget - tasksCompletedToday === 1 ? '' : 's'} to hit your daily goal.`}
        </p>
        <Progress value={progressValue} className="h-2 [&>div]:bg-blue-500" />
        <p className="text-sm text-muted-foreground text-right">
          {tasksCompletedToday}/{dailyChallengeTarget} tasks completed
        </p>
      </CardContent>
    </Card>
  );
};