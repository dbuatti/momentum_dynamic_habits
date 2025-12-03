import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Settings, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HomeHeaderProps {
  dayCounter: number;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const HomeHeader: React.FC<HomeHeaderProps> = ({ dayCounter }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'HH:mm');

  return (
    <header className="flex justify-between items-start p-4 sticky top-0 bg-background z-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{getGreeting()}</h1>
        <p className="text-md text-muted-foreground mt-1">
          Day {dayCounter} • {formattedTime}
        </p>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Clock className="w-4 h-4 mr-1.5" />
          <span>Last: about 11 hours ago</span>
        </div>
      </div>
      <div className="flex items-center">
        <Link to="/settings">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default HomeHeader;