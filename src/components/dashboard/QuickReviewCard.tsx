import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCw } from 'lucide-react';

export const QuickReviewCard = () => (
  <div className="bg-habit-green border border-habit-green-border rounded-2xl p-4 space-y-4">
    <div className="flex items-center space-x-2 text-habit-green-foreground">
      <BookOpen className="w-5 h-5" />
      <h3 className="font-semibold">Quick Review</h3>
    </div>
    <div className="bg-white dark:bg-card rounded-xl p-6 text-center">
      <p>What nerve innervates the quadriceps?</p>
    </div>
    <div className="flex justify-between items-center">
      <Button variant="link" className="text-habit-green-foreground">Show answer</Button>
      <Button className="bg-habit-green-foreground hover:bg-habit-green-foreground/90 text-white rounded-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        Next
      </Button>
    </div>
  </div>
);