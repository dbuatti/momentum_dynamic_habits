import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { showError, showSuccess } from '@/utils/toast';
import { Dumbbell, Wind, BookOpen, Music, Home, Code, Target, Clock, User, Sparkles, Pill, Brain, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useInitializeMissingHabits } from '@/hooks/useInitializeMissingHabits'; // Import the modified hook
import { initialHabits } from '@/lib/habit-data'; // Import initialHabits

const commonTimezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
];

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

// Helper maps for icons and colors (ensure these are defined or imported)
const habitIconMap: Record<string, React.ElementType> = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home,
  projectwork: Code,
  teeth_brushing: Sparkles,
  medication: Pill,
};

const habitColorMap: Record<string, string> = {
  pushups: 'bg-habit-orange',
  meditation: 'bg-habit-blue',
  kinesiology: 'bg-habit-green',
  piano: 'bg-habit-purple',
  housework: 'bg-habit-red',
  projectwork: 'bg-habit-indigo',
  teeth_brushing: 'bg-blue-500', // Using a direct color for now, can be mapped to habit-blue if needed
  medication: 'bg-purple-500', // Using a direct color for now, can be mapped to habit-purple if needed
};

// Use initialHabits from lib/habit-data.ts
const habitOptions = initialHabits.map(h => ({
  id: h.id,
  name: h.name,
  icon: habitIconMap[h.id], // Map icons based on habit ID
  color: habitColorMap[h.id] || 'bg-gray-200', // Fallback color
}));


export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [neurodivergentMode, setNeurodivergentMode] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const { mutate: updateProfile } = useUpdateProfile();
  const { mutate: initializeHabits } = useInitializeMissingHabits(); // Use the modified hook
  // Removed: const { mutate: updateHabitVisibility } = useUpdateHabitVisibility(); // Use new hook

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) ? prev.filter(id => id !== habitId) : [...prev, habitId]
    );
  };

  const handleComplete = async () => {
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        neurodivergent_mode: neurodivergentMode,
        timezone: selectedTimezone,
        default_auto_schedule_start_time: startTime,
        default_auto_schedule_end_time: endTime,
      });

      // Call the modified initializeHabits with selectedHabits
      await initializeHabits(selectedHabits);

      // Removed: Update visibility for all habits based on selection
      // for (const habit of initialHabits) {
      //   await updateHabitVisibility({
      //     habitKey: habit.id,
      //     isVisible: selectedHabits.includes(habit.id),
      //   });
      // }

      showSuccess('Welcome! Your profile has been set up.');
      onComplete();
    } catch (error) {
      showError('Failed to complete onboarding. Please try again.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Adaptive Growth!</h2>
              <p className="text-muted-foreground">Let's set up your profile.</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" className="h-12 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" className="h-12 rounded-xl" />
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <Label className="font-bold">Neurodivergent Mode</Label>
                  </div>
                  <Switch checked={neurodivergentMode} onCheckedChange={setNeurodivergentMode} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enables small habit increments, longer stabilization plateaus, and ADHD-friendly modular task capsules.
                </p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Time Preferences</h2>
              <p className="text-muted-foreground">Set your timezone and schedule.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger id="timezone" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimezones.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>End Time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Choose Your Habits</h2>
              <p className="text-muted-foreground">Select habits to track. Start small (1-2 recommended).</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {habitOptions.map((habit) => {
                const Icon = habit.icon;
                const isSelected = selectedHabits.includes(habit.id);
                return (
                  <div key={habit.id} className={`border rounded-xl p-3 cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border'}`} onClick={() => toggleHabit(habit.id)}>
                    <div className="flex flex-col items-center space-y-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${habit.color}`}><Icon className="w-5 h-5 text-white" /></div>
                      <span className="text-xs font-bold text-center leading-tight">{habit.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-muted-foreground">Focus on progress, not perfection. Your journey starts today.</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl rounded-3xl overflow-hidden border-0">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {step} of 4</div>
            <div className="text-xs font-bold text-primary">{Math.round(progress)}%</div>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
        </CardHeader>
        <CardContent className="py-8">
          {renderStep()}
          <div className="flex justify-between mt-8 gap-4">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="rounded-2xl px-8">Back</Button>
            <Button onClick={handleNext} disabled={(step === 1 && (!firstName.trim() || !lastName.trim())) || (step === 3 && selectedHabits.length === 0)} className="flex-1 rounded-2xl h-12 text-base font-bold">
              {step === 4 ? 'Enter Growth Coach' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};