import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface HomeHeaderProps {
  dayCounter: number;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ dayCounter }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'h:mm a');

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-background z-10">
      <div className="text-2xl font-bold text-foreground">
        {formattedTime}
      </div>
      <div className="text-sm text-muted-foreground">
        Day {dayCounter}
      </div>
    </header>
  );
};

export default HomeHeader;