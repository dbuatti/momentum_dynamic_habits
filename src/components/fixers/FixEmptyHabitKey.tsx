"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { generateHabitKey } from '@/utils/string';

interface FixEmptyHabitKeyProps {
  habitId: string;
  habitName: string;
  onComplete: () => void;
}

export const FixEmptyHabitKey: React.FC<FixEmptyHabitKeyProps> = ({ habitId, habitName, onComplete }) => {
  const handleFixKey = async () => {
    const newKey = generateHabitKey(habitName);
    
    if (!newKey) {
      showError('Could not generate a valid key from the habit name.');
      return;
    }

    const { error } = await supabase
      .from('user_habits')
      .update({ habit_key: newKey })
      .eq('id', habitId);

    if (error) {
      showError(`Failed to fix habit key: ${error.message}`);
    } else {
      showSuccess(`Fixed habit key to: "${newKey}"`);
      onComplete();
    }
  };

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          Habit Key Issue Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          The habit <strong>"{habitName}"</strong> has an empty <code>habit_key</code>. 
          This prevents it from being properly identified and expanded in the dashboard.
        </p>
        <Button onClick={handleFixKey} className="w-full">
          <Wrench className="w-4 h-4 mr-2" />
          Generate and Fix Key
        </Button>
      </CardContent>
    </Card>
  );
};