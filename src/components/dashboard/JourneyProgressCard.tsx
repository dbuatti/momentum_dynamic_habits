import { Progress } from '@/components/ui/progress';

export const JourneyProgressCard = () => {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-baseline">
        <h3 className="font-semibold">Day 7 <span className="font-normal text-muted-foreground">of 338</span></h3>
        <p className="text-sm text-muted-foreground">23 days to 1 month</p>
      </div>
      <div className="relative my-3">
        <Progress value={(7/338)*100} className="h-1.5" />
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0.5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-background rounded-full"></div>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">1 week in • keep going</p>
    </div>
  );
};