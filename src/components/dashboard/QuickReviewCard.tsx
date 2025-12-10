import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCw, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface QuickReviewCardProps {
  question: string;
  answer: string;
  onNext: () => void;
}

export const QuickReviewCard: React.FC<QuickReviewCardProps> = ({ question, answer, onNext }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleNextClick = () => {
    setShowAnswer(false);
    onNext();
  };

  return (
    <Card className="bg-habit-green border border-habit-green-border rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center space-x-2 text-habit-green-foreground">
          <BookOpen className="w-5 h-5" />
          <h3 className="font-semibold">Quick Review</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="bg-white dark:bg-card rounded-xl p-6 text-center min-h-[140px] flex items-center justify-center mb-5 shadow-inner">
          <p className="text-lg font-medium">{showAnswer ? answer : question}</p>
        </div>
        <div className="flex justify-between items-center">
          <Button 
            variant="link" 
            className="text-habit-green-foreground p-0 h-auto flex items-center"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Hide answer
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Show answer
              </>
            )}
          </Button>
          <Button 
            className="bg-habit-green-foreground hover:bg-habit-green-foreground/90 text-white rounded-full px-5"
            onClick={handleNextClick}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};