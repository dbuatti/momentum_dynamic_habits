"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useResetProgress } from '@/hooks/useResetProgress';

export const ResetProgressCard: React.FC = () => {
  const { mutate: resetProgress, isPending } = useResetProgress();

  return (
    <Card className="rounded-3xl shadow-sm border-2 border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-destructive/20 p-2.5 rounded-xl">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="font-black uppercase tracking-tight text-destructive">Danger Zone</p>
            <p className="text-xs text-muted-foreground">Reset all your progress and start fresh.</p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full h-12 rounded-2xl font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5 mr-2" />
              )}
              {isPending ? 'Resetting...' : 'Reset All Progress'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your habit progress, XP, streaks, and reset your profile to a fresh state.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => resetProgress()} 
                className="rounded-xl bg-destructive hover:bg-destructive/90"
                disabled={isPending}
              >
                {isPending ? 'Resetting...' : 'Confirm Reset'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};