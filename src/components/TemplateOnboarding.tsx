import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface TemplateOnboardingProps {
  onAccept: () => void;
}

export function TemplateOnboarding({ onAccept }: TemplateOnboardingProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Would you like to start with some prefilled templates?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold">Pushups</h3>
            <p className="text-sm text-muted-foreground">Start with 1 pushup. Increases incrementally.</p>
          </div>
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold">Be Still</h3>
            <p className="text-sm text-muted-foreground">Start with 5 seconds of stillness. Increases incrementally.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onAccept} className="w-full">Yes, use templates</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
