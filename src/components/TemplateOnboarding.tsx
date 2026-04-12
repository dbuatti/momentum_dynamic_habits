import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Target, Zap } from "lucide-react";

interface TemplateOnboardingProps {
  onAccept: () => void;
}

export function TemplateOnboarding({ onAccept }: TemplateOnboardingProps) {
  return (
    <Card className="w-full max-w-md border-4 border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center pt-8">
        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight">Welcome!</CardTitle>
        <CardDescription className="text-lg font-medium">
          Ready to build some momentum?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-8">
        <div className="p-5 rounded-[1.5rem] bg-secondary/30 border-2 border-secondary flex items-center gap-4">
          <div className="p-2 rounded-xl bg-white shadow-sm">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight">Pushups</h3>
            <p className="text-xs font-bold text-muted-foreground">Start small, grow big.</p>
          </div>
        </div>
        <div className="p-5 rounded-[1.5rem] bg-accent/30 border-2 border-accent flex items-center gap-4">
          <div className="p-2 rounded-xl bg-white shadow-sm">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight">Be Still</h3>
            <p className="text-xs font-bold text-muted-foreground">Master your focus.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-8 pt-4">
        <Button 
          onClick={onAccept} 
          className="w-full h-16 text-xl font-black rounded-[2rem] shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all btn-bubbly"
        >
          Let's Go!
        </Button>
      </CardFooter>
    </Card>
  );
}