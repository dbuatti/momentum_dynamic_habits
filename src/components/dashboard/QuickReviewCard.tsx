import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

interface QuickReviewCardProps {
  question: string;
  answer: string;
  onNext: () => void; // Function to fetch next question
}

export const QuickReviewCard: React.FC<QuickReviewCardProps> = ({ question, answer, onNext }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleNextClick = () => {
    setShowAnswer(false);
    onNext();
  };

  return (
    <div className="bg-habit-green border border-habit-green-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center space-x-2 text-habit-green-foreground">
        <BookOpen className="w-5 h-5" />
        <h3 className="font-semibold">Quick Review</h3>
      </div>
      <div className="bg-white dark:bg-card rounded-xl p-6 text-center min-h-[100px] flex items-center justify-center">
        <p className="text-lg font-medium">{showAnswer ? answer : question}</p>
      </div>
      <div className="flex justify-between items-center">
        <Button variant="link" className="text-habit-green-foreground" onClick={() => setShowAnswer(!showAnswer)}>
          {showAnswer ? 'Hide answer' : 'Show answer'}
        </Button>
        <Button className="bg-habit-green-foreground hover:bg-habit-green-foreground/90 text-white rounded-full" onClick={handleNextClick}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Next
        </Button>
      </div>
    </div>
  );
};