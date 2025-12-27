import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, User, Trophy, Zap, Settings, Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getXpForNextLevel, getXpForCurrentLevelStart } from '@/utils/leveling';

interface HomeHeaderProps {
  dayCounter: number;
  lastActiveText: string;
  firstName: string | null;
  lastName: string | null;
  xp: number;
  level: number;
  tasksCompletedToday?: number; // Now represents completed parts
  dailyChallengeTarget?: number; // Now represents total eligible parts
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
  level,
  tasksCompletedToday = 0,
  dailyChallengeTarget = 0 // Default to 0 if no eligible tasks
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'HH:mm');
  
  const xpForCurrentLevelStart = getXpForCurrentLevelStart(level);
  const xpForNextLevel = getXpForNextLevel(level);
  const xpProgressInCurrentLevel = Math.max(0, xp - xpForCurrentLevelStart);
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevelStart;
  const levelProgress = xpNeededForNextLevel > 0 ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 : 0;

  const challengeProgress = dailyChallengeTarget > 0 ? Math.min(100, (tasksCompletedToday / dailyChallengeTarget) * 100) : 0;
  const isChallengeComplete = dailyChallengeTarget > 0 && tasksCompletedToday >= dailyChallengeTarget;

  return (
    <Card className="w-full mb-6 border-0 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 relative">
          <Link to="/settings" className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 text-foreground/70 hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <Avatar className="w-14 h-14 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {getGreeting(firstName, lastName)}
                </h1>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="w-4 h-4 mr-1.5" />
                  <span>Last: {lastActiveText}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end sm:items-center md:flex-row md:gap-3">
              <div className="text-right md:text-center">
                <p className="text-xs font-semibold text-muted-foreground flex items-center justify-end md:justify-center">
                  <Trophy className="w-3 h-3 mr-1" />
                  LVL {level}
                </p>
                <p className="text-lg font-bold text-foreground">{xp} XP</p>
              </div>
              <div className="bg-primary rounded-full w-14 h-14 flex items-center justify-center shadow-md mt-2 md:mt-0">
                <span className="text-lg font-bold text-primary-foreground">{level}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-5 py-4 bg-card/50 border-t space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               <div className="flex items-center gap-1">
                 <Star className="w-3 h-3 text-warning fill-warning" />
                 <span>Growth Level {level}</span>
               </div>
               <span>{Math.round(xpProgressInCurrentLevel)} / {xpNeededForNextLevel} XP</span>
            </div>
            <Progress value={levelProgress} className="h-1.5 [&>div]:bg-warning" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               <div className="flex items-center gap-1">
                 <CheckCircle2 className={cn("w-3 h-3", isChallengeComplete ? "text-success" : "text-primary")} />
                 <span>Daily Momentum</span>
               </div>
               <span className={cn(isChallengeComplete && "text-success")}>
                 {tasksCompletedToday} / {dailyChallengeTarget} Parts
               </span>
            </div>
            <Progress value={challengeProgress} className={cn("h-1.5", isChallengeComplete ? "[&>div]:bg-success" : "[&>div]:bg-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomeHeader;