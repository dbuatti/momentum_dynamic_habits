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

const Index = () => {
  const habits = getHabits();
  
  // Calculate overall daily progress (simplified: based on number of habits completed)
  const completedHabits = habits.filter(h => h.currentProgress >= h.targetGoal).length;
  const totalHabits = habits.length;
  const overallProgress = (completedHabits / totalHabits) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomeHeader dayCounter={42} /> {/* Placeholder day counter */}
      
      <main className="flex-grow p-4 space-y-6 max-w-lg mx-auto w-full">
        
        {/* Immediate Start Section: Prominent Goal Buttons */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Immediate Start</h2>
          {habits.map((habit) => (
            <GoalButton key={habit.id} habit={habit} />
          ))}
        </section>

        <Separator />

        {/* Progress Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">Today's Progress</h2>
            <Link to="/journey">
              <Button variant="ghost" size="sm" className="text-sm text-primary">
                Journey <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {completedHabits} of {totalHabits} habits completed ({Math.round(overallProgress)}%)
          </p>
        </section>

        <Separator />

        {/* Habit Cards: Collapsible sections for detailed viewing */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Habit Details</h2>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </section>
        
        {/* Resilience Features Placeholder */}
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