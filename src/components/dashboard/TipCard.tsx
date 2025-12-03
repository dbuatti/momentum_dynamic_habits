import { Lightbulb, Music } from 'lucide-react';

export const TipCard = () => (
  <div className="bg-habit-purple border border-habit-purple-border rounded-2xl p-4 flex items-start space-x-3">
    <div className="bg-white rounded-full p-2">
      <Lightbulb className="w-5 h-5 text-habit-purple-foreground" />
    </div>
    <div>
      <h4 className="font-semibold text-habit-purple-foreground">Today's tip</h4>
      <p className="text-foreground">Listen to a recording before playing</p>
      <div className="flex items-center space-x-1.5 text-sm text-muted-foreground mt-1">
        <Music className="w-3 h-3" />
        <span>Working on: Blues pno</span>
      </div>
    </div>
  </div>
);