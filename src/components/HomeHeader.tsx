import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, User, Trophy, Zap, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
  
  // Calculate XP for level progression
  const xpForCurrentLevel = 50 * level * (level - 1);
  const xpForNextLevel = 50 * (level + 1) * level;
  
  // Ensure XP progress is non-negative
  const xpProgressInCurrentLevel = Math.max(0, xp - xpForCurrentLevel);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  const levelProgress = xpNeededForNextLevel > 0 
    ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 
    : 0;

  return (
    <Card className="w-full mb-6 border-0 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 relative">
          <Link to="/settings" className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 text-foreground/70 hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <Avatar className="w-14 h-14 border-2 border-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="w-6 h-6" />
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
                  <p className="text-xs font-semibold text-muted-foreground flex items-center">
                    <Trophy className="w-3 h-3 mr-1" />
                    LVL {level}
                  </p>
                  <p className="text-lg font-bold text-foreground">{xp} XP</p>
                </div>
                <div className="bg-primary rounded-full w-14 h-14 flex items-center justify-center shadow-md">
                  <span className="text-lg font-bold text-primary-foreground">{level}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Day {dayCounter} • {formattedTime}
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{xpProgressInCurrentLevel} XP</span>
            <span>{xpNeededForNextLevel} XP to next level</span>
          </div>
          <Progress 
            value={levelProgress} 
            className="h-2 [&>div]:bg-primary" 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default HomeHeader;