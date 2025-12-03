import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';

const StudyLog = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link to="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-green-600">Kinesiology Study</h1>
        <p className="text-xl text-muted-foreground">
          Study Timer and Flashcard Placeholder UI.
        </p>
        <div className="p-8 bg-card rounded-xl shadow-lg border border-green-300">
            <Clock className="w-10 h-10 mx-auto text-green-600 mb-4" />
            <p className="text-5xl font-extrabold">00:00</p>
            <Button className="mt-4 bg-green-600 hover:bg-green-700">Start Session</Button>
        </div>
        <div className="p-3 bg-accent rounded-md border border-border">
            <p className="text-sm font-medium text-accent-foreground">
                Completion Prompt: Space built. You showed up! Now, look at one piece of paper before you leave the area.
            </p>
        </div>
      </div>
    </div>
  );
};

export default StudyLog;