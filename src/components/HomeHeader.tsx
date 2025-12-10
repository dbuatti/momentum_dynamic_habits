import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface HomeHeaderProps {
  dayCounter: number;
  lastActiveText: string;
  firstName: string | null;
  lastName: string | null; // New prop for Last Name
  xp: number;
  level: number;
}

const getGreeting = (firstName: string | null, lastName: string | null) => {
  const hour = new Date().getHours();
  let greeting = "";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return fullName ? `${greeting}, ${fullName}` : greeting;
};

const HomeHeader: React.FC<HomeHeaderProps> = ({ dayCounter, lastActiveText, firstName, lastName, xp, level }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'HH:mm');

  return (
    <header className="flex justify-between items-start bg-background">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{getGreeting(firstName, lastName)}</h1>
        <p className="text-md text-muted-foreground mt-1">
          Day {dayCounter} • {formattedTime}
        </p>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Clock className="w-4 h-4 mr-1.5" />
          <span>Last: {lastActiveText}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-muted-foreground">LVL {level}</p>
        <p className="text-lg font-bold text-foreground">{xp} XP</p>
      </div>
    </header>
  );
};

export default HomeHeader;