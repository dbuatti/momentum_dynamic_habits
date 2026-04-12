import { Button } from "@/components/ui/button";
import { Sparkles, Target, Zap } from "lucide-react";

interface TemplateOnboardingProps {
  onAccept: () => void;
}

export function TemplateOnboarding({ onAccept }: TemplateOnboardingProps) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-10 py-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-white/40 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-primary uppercase italic">Welcome!</h1>
        <p className="text-xl font-bold text-muted-foreground/60">
          Ready to build some momentum?
        </p>
      </div>

      <div className="w-full space-y-4">
        <div className="p-6 rounded-[2rem] bg-white/30 flex items-center gap-5 transition-transform hover:scale-105">
          <div className="p-3 rounded-2xl bg-white shadow-sm">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tight text-primary">Pushups</h3>
            <p className="text-sm font-bold text-muted-foreground/70">Start small, grow big.</p>
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-white/30 flex items-center gap-5 transition-transform hover:scale-105">
          <div className="p-3 rounded-2xl bg-white shadow-sm">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tight text-primary">Be Still</h3>
            <p className="text-sm font-bold text-muted-foreground/70">Master your focus.</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={onAccept} 
        className="w-full h-24 text-3xl font-black rounded-[3rem] bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
      >
        Let's Go!
      </Button>
    </div>
  );
}