import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Keep Link for potential future use, but remove the back button instance
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useHabitLog } from '@/hooks/useHabitLog';

const PianoLog = () => {
  const location = useLocation();
  const durationInMinutes = location.state?.duration || 1;
  const initialTime = durationInMinutes * 60;

  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [completedSongs, setCompletedSongs] = useState<string[]>([]);
  const { mutate: logHabit, isPending } = useHabitLog();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const targetSongs = ["Song A", "Song B", "Song C", "Song D", "Song E"];

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeRemaining]);

  const handleToggle = () => {
    if (isFinished) return;
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsFinished(false);
    setTimeRemaining(initialTime);
    setCompletedSongs([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleLog = () => {
    if (durationInMinutes > 0) {
      logHabit({
        habitKey: 'piano',
        value: durationInMinutes,
        taskName: 'Piano Practice',
      });
    }
  };

  const handleSongCheck = (song: string, checked: boolean) => {
    setCompletedSongs((prev) => 
      checked ? [...prev, song] : prev.filter((s) => s !== song)
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col items-center flex-grow"> {/* Adjusted styling */}
      {/* Removed Link to="/" back button */}
      <div className="text-center space-y-6 mt-12 w-full max-w-md">
        <h1 className="text-4xl font-bold text-green-600">Piano Practice</h1>
        
        <div className="p-6 bg-card rounded-xl shadow-lg border-4 border-green-300">
            <p className="text-4xl font-extrabold">{formatTime(timeRemaining)}</p>
            <div className="flex items-center justify-center space-x-4 mt-4">
                <Button 
                    size="lg" 
                    className="w-32 h-16 rounded-full bg-green-600 hover:bg-green-700"
                    onClick={handleToggle}
                    disabled={isFinished || isPending}
                >
                    {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
                {(isActive || isFinished) && (
                    <Button size="icon" variant="outline" onClick={handleReset} disabled={isPending}>
                        <RotateCcw className="w-6 h-6" />
                    </Button>
                )}
            </div>
        </div>

        <div className="space-y-3 text-left">
            <h2 className="text-xl font-semibold">Gig Tracker ({completedSongs.length} / {targetSongs.length} Songs)</h2>
            {targetSongs.map((song, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Checkbox 
                        id={`song-${index}`} 
                        checked={completedSongs.includes(song)}
                        onCheckedChange={(checked) => handleSongCheck(song, checked as boolean)}
                        disabled={isPending}
                    />
                    <Label htmlFor={`song-${index}`} className="text-base font-medium">
                        {song}
                    </Label>
                </div>
            ))}
        </div>

        {isFinished && (
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-lg py-6" 
            onClick={handleLog} 
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : `Log ${durationInMinutes} minute session`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PianoLog;