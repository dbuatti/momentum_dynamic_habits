import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PublicHeader: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'h:mm a');

  return (
    <header className="flex justify-between items-center p-4 sticky top-0 bg-background z-10">
      <div className="text-2xl font-bold text-foreground">
        {formattedTime}
      </div>
      <Link to="/login">
        <Button>Login / Sign Up</Button>
      </Link>
    </header>
  );
};

export default PublicHeader;