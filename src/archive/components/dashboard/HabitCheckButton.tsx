import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { Habit } from '@/types/habit';
import { initialHabits } from '@/lib/habit-data'; // Keep for fallback if needed, but prioritize DB

interface HabitCheckButtonProps {
  habitKey: string;
  habitName: string; // Added habitName prop
  isComplete: boolean;
  dailyGoal: number;
  onCheck: () => void;
}

export const HabitCheckButton: React.FC<HabitCheckButtonProps> = ({ 
  habitKey, 
  habitName, // Use habitName prop
  isComplete, 
  dailyGoal, 
  onCheck 
}) => {
  const { mutate: logHabit, isPending } = useHabitLog();
  
  const handleCheck = () => {
    // Log the habit with the daily goal value
    logHabit({ 
      habitKey: habitKey, 
      value: dailyGoal, // Log the daily goal as the value
      taskName: habitName, // Use the passed habitName
    });
    
    // Notify parent component
    onCheck();
  };

  if (isComplete) {
    return (
      <div className="flex items-center text-success-foreground bg-success-background px-3 py-1.5 rounded-full">
        <Check className="w-4 h-4 mr-1" />
        <span className="text-xs font-medium">Completed</span>
      </div>
    );
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="h-8 px-3 text-xs rounded-full"
      onClick={handleCheck}
      disabled={isPending}
    >
      {isPending ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <Check className="w-3 h-3 mr-1" />
          Mark Done
        </>
      )}
    </Button>
  );
};