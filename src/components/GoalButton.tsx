import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Habit } from '../../types/habit';
import { cn } from '@/lib/utils';

interface GoalButtonProps {
  habit: Habit;
}

const GoalButton: React.FC<GoalButtonProps> = ({ habit }) => {
  // Determine color based on habit type (Coral/Orange for Active, Blue/Purple for Calm/Focus)
  const buttonColorClass = habit.id === 'pushups' 
    ? 'bg-orange-500 hover:bg-orange-600 text-white' // Active (Coral/Orange)
    : habit.id === 'meditation'
    ? 'bg-indigo-500 hover:bg-indigo-600 text-white' // Calm (Blue/Purple)
    : 'bg-green-600 hover:bg-green-700 text-white'; // Focus/Study (Subtle Green)

  const displayGoal = habit.type === 'time' 
    ? `${habit.targetGoal} ${habit.unit}`
    : `${habit.targetGoal}`;

  return (
    <Link to={habit.route} className="w-full block">
      <Button 
        className={cn(
          "w-full h-24 text-3xl font-extrabold shadow-lg transition-transform duration-150 ease-in-out active:scale-[0.98]",
          buttonColorClass
        )}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-medium opacity-80">{habit.name} Goal</span>
          <span>{displayGoal}</span>
        </div>
      </Button>
    </Link>
  );
};

export default GoalButton;