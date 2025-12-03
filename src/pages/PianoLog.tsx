import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const PianoLog = () => {
  const targetSongs = ["Song A", "Song B", "Song C", "Song D", "Song E"];

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-background">
      <Link to="/dashboard" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      <div className="text-center space-y-6 mt-12 w-full max-w-md">
        <h1 className="text-4xl font-bold text-green-600">Piano Practice</h1>
        
        <div className="p-6 bg-card rounded-xl shadow-lg">
            <Music className="w-8 h-8 mx-auto text-green-600 mb-3" />
            <p className="text-4xl font-extrabold">00:00</p>
            <Button className="mt-4 bg-green-600 hover:bg-green-700">Start Timer</Button>
        </div>

        <div className="space-y-3 text-left">
            <h2 className="text-xl font-semibold">Gig Tracker (5 Songs)</h2>
            {targetSongs.map((song, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Checkbox id={`song-${index}`} />
                    <Label htmlFor={`song-${index}`} className="text-base font-medium">
                        {song}
                    </Label>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PianoLog;