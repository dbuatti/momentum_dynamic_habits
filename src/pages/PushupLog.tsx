import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PushupLog = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link to="/dashboard" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-orange-500">Push-ups Counter</h1>
        <p className="text-xl text-muted-foreground">
          Interactive Counter implementation goes here.
        </p>
        <div className="p-10 bg-card rounded-xl shadow-lg">
            <p className="text-6xl font-extrabold">0</p>
            <p className="text-sm text-muted-foreground mt-2">Tap to increment (Haptic Feedback)</p>
        </div>
        <div className="flex space-x-4 justify-center">
            <Button className="bg-orange-500 hover:bg-orange-600">+5</Button>
            <Button className="bg-orange-500 hover:bg-orange-600">+10</Button>
        </div>
        <p className="text-sm text-green-600">Today's Variety: Diamond Push-ups</p>
      </div>
    </div>
  );
};

export default PushupLog;