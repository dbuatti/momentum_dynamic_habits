import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCw, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface QuickReviewCardProps {
  question: string;
  answer: string;
  onNext: () => void;
}

export const QuickReviewCard: React.FC<QuickReviewCardProps> = ({ question, answer, onNext }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAnswer, setShowAnswer] = useState(false);

  const handleNextClick = () => {
    setShowAnswer(false);
    onNext();
  };

  // Theme-aware colors
  const cardBg = isDark ? "bg-[hsl(var(--habit-green))]/20" : "bg-[hsl(var(--habit-green))]";
  const cardBorder = isDark ? "border-[hsl(var(--habit-green-border))]" : "border-[hsl(var(--habit-green-border))]";
  const cardText = isDark ? "text-[hsl(var(--habit-green-foreground))]" : "text-[hsl(var(--habit-green-foreground))]";
  const innerBg = isDark ? "bg-[hsl(var(--card))]" : "bg-white";

  return (
    <Card className={cn("rounded-2xl shadow-sm border-0", cardBg, cardBorder, cardText)}>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5" />
          <h3 className="font-semibold">Quick Review</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className={cn("rounded-xl p-6 text-center min-h-[140px] flex items-center justify-center mb-5 shadow-inner", innerBg)}>
          <p className="text-lg font-medium">{showAnswer ? answer : question}</p>
        </div>
        <div className="flex justify-between items-center">
          <Button 
            variant="link" 
            className={cn("p-0 h-auto flex items-center", cardText)}
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
            className={cn("rounded-full px-5", isDark ? "bg-[hsl(var(--habit-green-foreground))] hover:bg-[hsl(var(--habit-green-foreground))]/90" : "bg-[hsl(var(--habit-green-foreground))] hover:bg-[hsl(var(--habit-green-foreground))]/90")}
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