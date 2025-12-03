import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Habit } from '../types/habit';
import { cn } from '@/lib/utils';
import { Dumbbell, Clock, BookOpen, Music } from 'lucide-react';

interface GoalButtonProps {
  habit: Habit;
}

const getIcon = (id: string) => {
  switch (id) {
    case 'pushups':
      return <Dumbbell className="w-5 h-5" />;
    case 'meditation':
      return <Clock className="w-5 h-5" />;
    case 'kinesiology':
      return <BookOpen className="w-5 h-5" />;
    case 'piano':
      return <Music className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

const GoalButton: React.FC<GoalButtonProps> = ({ habit }) => {
  const buttonColorClass = habit.id === 'pushups' 
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : habit.id === 'meditation'
    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
    : 'bg-green-600 hover:bg-green-700 text-white';

  return (
    <Link to={habit.route} className="w-full block">
      <Button 
        className={cn(
          "w-full h-24 flex flex-col items-center justify-center shadow-lg transition-transform duration-150 ease-in-out active:scale-[0.98] relative",
          buttonColorClass
        )}
      >
        <div className="absolute top-3 left-4 flex items-center space-x-2 opacity-80">
          {getIcon(habit.id)}
          <span className="text-sm font-medium">{habit.name}</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-6xl font-extrabold">{habit.targetGoal}</span>
          <span className="text-xl font-medium ml-2">{habit.unit}</span>
        </div>
      </Button>
    </Link>
  );
};

export default GoalButton;