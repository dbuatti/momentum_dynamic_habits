import { MadeWithDyad } from "@/components/made-with-dyad";
import PublicHeader from "@/components/PublicHeader";
import GoalButton from "@/components/GoalButton";
import HabitCard from "@/components/HabitCard";
import { getHabits } from "@/lib/habit-data";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const PublicHome = () => {
  const habits = getHabits();
  
  const completedHabits = 0; // Static for demo
  const totalHabits = habits.length;
  const overallProgress = 0; // Static for demo

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      
      <main className="flex-grow p-4 space-y-8 max-w-lg mx-auto w-full">
        
        <div className="text-center p-4 bg-card rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold">Welcome to the Adaptive Growth Coach</h1>
            <p className="text-muted-foreground mt-2">This is a preview of the app. Click any goal to sign up and start your journey!</p>
        </div>

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
            <Link to="/login">
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
            <Link to="/login">
                <Button variant="outline" className="text-sm">
                    Rest Day (Guilt-Free Break)
                </Button>
            </Link>
        </section>

      </main>
      
      <MadeWithDyad />
    </div>
  );
};

export default PublicHome;