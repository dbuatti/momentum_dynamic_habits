import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';

const MeditationLog = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link to="/dashboard" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-indigo-500">Meditation Timer</h1>
        <p className="text-xl text-muted-foreground">
          Immersive Timer and Breathing Guide implementation goes here.
        </p>
        <div className="p-10 bg-card rounded-full w-48 h-48 flex items-center justify-center mx-auto shadow-xl border-4 border-indigo-300">
            <Button size="icon" className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-600">
                <Play className="w-8 h-8" />
            </Button>
        </div>
        <div className="space-y-2">
            <p className="text-sm font-medium">Sound: Rain</p>
            <p className="text-sm font-medium">Guide: Free (Just Be)</p>
        </div>
      </div>
    </div>
  );
};

export default MeditationLog;