import { Button } from "@/components/ui/button";
import { Target, Zap } from "lucide-react";

interface TemplateOnboardingProps {
  onAccept: () => void;
}

export function TemplateOnboarding({ onAccept }: TemplateOnboardingProps) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-10 py-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-white/20 flex items-center justify-center mb-6">
          <Zap className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Welcome!</h1>
        <p className="text-xl font-bold text-white/60">
          Ready to build some momentum?
        </p>
      </div>

      <div className="w-full space-y-4">
        <div className="p-6 rounded-[2rem] bg-white/10 border border-white/10 flex items-center gap-5 transition-transform hover:scale-105">
          <div className="p-3 rounded-2xl bg-white shadow-sm">
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tight text-white">Pushups</h3>
            <p className="text-sm font-bold text-white/70">Start small, grow big.</p>
          </div>
        </div>
        <div className="p-6 rounded-[2rem] bg-white/10 border border-white/10 flex items-center gap-5 transition-transform hover:scale-105">
          <div className="p-3 rounded-2xl bg-white shadow-sm">
            <Target className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tight text-white">Be Still</h3>
            <p className="text-sm font-bold text-white/70">Master your focus.</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={onAccept} 
        className="w-full h-24 text-3xl font-black rounded-[3rem] bg-white text-orange-500 shadow-2xl hover:scale-105 active:scale-95 transition-all"
      >
        Let's Go!
      </Button>
    </div>
  );
}