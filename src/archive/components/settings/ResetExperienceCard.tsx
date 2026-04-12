"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
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
import { useResetExperience } from '@/hooks/useResetExperience';

export const ResetExperienceCard: React.FC = () => {
  const { mutate: resetExperience, isPending } = useResetExperience();

  return (
    <Card className="rounded-3xl shadow-sm border-2 border-warning/50 bg-warning/5 dark:bg-warning/10">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-warning/20 p-2.5 rounded-xl">
            <Zap className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="font-black uppercase tracking-tight text-warning">Reset Experience</p>
            <p className="text-xs text-muted-foreground">Reset your XP, level, and streaks, but keep your habits.</p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-2xl font-bold border-warning text-warning hover:bg-warning/10"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 mr-2" />
              )}
              {isPending ? 'Resetting...' : 'Reset Experience'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-warning">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will reset your XP, level, daily streaks, and badges. Your existing habits and their completed tasks will remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => resetExperience()} 
                className="rounded-xl bg-warning hover:bg-warning/90"
                disabled={isPending}
              >
                {isPending ? 'Resetting...' : 'Confirm Reset Experience'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};