import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HomeHeaderProps {
  dayCounter: number;
  lastActiveText: string;
  firstName: string | null;
  lastName: string | null;
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

const HomeHeader: React.FC<HomeHeaderProps> = ({ 
  dayCounter, 
  lastActiveText, 
  firstName, 
  lastName, 
  xp, 
  level 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'HH:mm');
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'User';

  return (
    <Card className="w-full mb-6 border-0 shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-habit-purple text-habit-purple-foreground">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {getGreeting(firstName, lastName)}
              </h1>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Clock className="w-4 h-4 mr-1.5" />
                <span>Last: {lastActiveText}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground">LVL {level}</p>
                <p className="text-lg font-bold text-foreground">{xp} XP</p>
              </div>
              <div className="bg-habit-orange rounded-full w-12 h-12 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{level}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Day {dayCounter} • {formattedTime}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomeHeader;