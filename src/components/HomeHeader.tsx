import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface HomeHeaderProps {
  dayCounter: number;
  lastActiveText: string;
  firstName: string | null;
}

const getGreeting = (firstName: string | null) => {
  const hour = new Date().getHours();
  let greeting = "";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  return firstName ? `${greeting}, ${firstName}` : greeting;
};

const HomeHeader: React.FC<HomeHeaderProps> = ({ dayCounter, lastActiveText, firstName }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'HH:mm');

  return (
    <header className="flex justify-between items-start p-4 bg-background"> {/* Removed sticky top-0 z-10 */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{getGreeting(firstName)}</h1>
        <p className="text-md text-muted-foreground mt-1">
          Day {dayCounter} • {formattedTime}
        </p>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Clock className="w-4 h-4 mr-1.5" />
          <span>Last: {lastActiveText}</span>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;