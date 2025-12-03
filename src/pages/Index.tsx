import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHeader from "@/components/HomeHeader";
import GoalButton from "@/components/GoalButton";
import HabitCard from "@/components/HabitCard";
import { getHabits } from "@/lib/habit-data";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { differenceInDays, startOfDay } from 'date-fns';

const Index = () => {
  const habits = getHabits();
  
  const completedHabits = habits.filter(h => h.currentProgress >= h.targetGoal).length;
  const totalHabits = habits.length;
  const overallProgress = (completedHabits / totalHabits) * 100;

  // Calculate the day counter dynamically
  const startDate = new Date('2024-08-01');
  const today = startOfDay(new Date());
  const dayCounter = differenceInDays(today, startDate) + 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomeHeader dayCounter={dayCounter} />
      
      <main className="flex-grow p-4 space-y-8 max-w-lg mx-auto w-full">
        
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Immediate Start</h2>
          {habits.map((habit) => (
            <GoalButton key={habit.id} habit={habit} />
          ))}
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Today's Progress</h2>
            <Link to="/journey">
              <Button variant="ghost" size="sm" className="text-sm text-primary">
                Journey <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground text-center">
            {completedHabits} of {totalHabits} habits completed
          </p>
        </section>

        <Separator />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Habit Details</h2>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </section>
        
        <section className="flex justify-center pt-4">
          <Button variant="outline" className="text-sm">
            Rest Day (Guilt-Free Break)
          </Button>
        </section>

      </main>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;