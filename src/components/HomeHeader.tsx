import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

interface HomeHeaderProps {
  dayCounter: number;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ dayCounter }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { session } = useSession();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formattedTime = format(currentTime, 'h:mm a');

  return (
    <header className="flex justify-between items-center p-4 sticky top-0 bg-background z-10">
      <div className="text-2xl font-bold text-foreground">
        {formattedTime}
      </div>
      <div className="flex items-center space-x-4">
        <Badge variant="outline" className="text-sm font-medium">
          Day {dayCounter}
        </Badge>
        {session && (
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default HomeHeader;