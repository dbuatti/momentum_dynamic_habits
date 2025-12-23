import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { showError, showSuccess } from '@/utils/toast';
import { Dumbbell, Wind, BookOpen, Music, Home, Code, Target, Clock, User, Sparkles, Pill, Brain, Zap, Layers, CheckCircle2, Info, Anchor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useInitializeMissingHabits } from '@/hooks/useInitializeMissingHabits';
import { habitTemplates, habitCategories, habitUnits } from '@/lib/habit-templates'; // Import habitTemplates and categories
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  study_generic: BookOpen,
  exercise_generic: Dumbbell,
  mindfulness_generic: Wind,
  creative_practice_generic: Music,
  daily_task_generic: Home,
  fixed_medication: Pill,
  fixed_teeth_brushing: Sparkles,
  custom_habit: Target,
};

const habitColorMap: Record<string, string> = {
  pushups: 'bg-habit-orange',
  meditation: 'bg-habit-blue',
  kinesiology: 'bg-habit-green',
  piano: 'bg-habit-purple',
  housework: 'bg-habit-red',
  projectwork: 'bg-habit-indigo',
  teeth_brushing: 'bg-blue-500',
  medication: 'bg-purple-500',
  study_generic: 'bg-habit-green',
  exercise_generic: 'bg-habit-orange',
  mindfulness_generic: 'bg-habit-blue',
  creative_practice_generic: 'bg-habit-purple',
  daily_task_generic: 'bg-habit-red',
  fixed_medication: 'bg-purple-500',
  fixed_teeth_brushing: 'bg-blue-500',
  custom_habit: 'bg-habit-indigo',
};

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [neurodivergentMode, setNeurodivergentMode] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // New questionnaire states
  const [numHabitsToGenerate, setNumHabitsToGenerate] = useState(2); // Slider 1-5
  const [isFoundationalRoutine, setIsFoundationalRoutine] = useState(false); // Yes/No for anchorPractice
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]); // Multi-select categories
  const [isLowPressureStart, setIsLowPressureStart] = useState(true); // Yes/No for Trial/Growth/Fixed
  const [sessionDurationPreference, setSessionDurationPreference] = useState<'short' | 'medium' | 'long'>('medium'); // Short/Medium/Long
  const [weeklyFrequencyPreference, setWeeklyFrequencyPreference] = useState(4); // Slider 1-7
  const [allowChunks, setAllowChunks] = useState(true); // Yes/No for auto-chunking

  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: initializeHabits } = useInitializeMissingHabits();

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleFocusArea = (category: string) => {
    setSelectedFocusAreas(prev => 
      prev.includes(category) ? prev.filter(id => id !== category) : [...prev, category]
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
        // Store new onboarding preferences in profile
        num_initial_habits: numHabitsToGenerate,
        initial_habit_categories: isFoundationalRoutine ? ['anchor'] : selectedFocusAreas, // Store 'anchor' if foundational
        initial_low_pressure_start: isLowPressureStart,
        initial_session_duration_preference: sessionDurationPreference,
        initial_allow_chunks: allowChunks,
      });

      await initializeHabits({
        numHabits: numHabitsToGenerate,
        isFoundational: isFoundationalRoutine,
        focusAreas: selectedFocusAreas,
        isLowPressure: isLowPressureStart,
        sessionDuration: sessionDurationPreference,
        weeklyFrequency: weeklyFrequencyPreference,
        allowChunks: allowChunks,
        neurodivergentMode: neurodivergentMode, // Pass neurodivergentMode for plateau logic
      });

      showSuccess('Welcome! Your profile and initial habits have been set up.');
      onComplete(); // Call onComplete after all async operations
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Enables smaller habit increments, longer stabilization plateaus, and ADHD-friendly modular task capsules to reduce overwhelm.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch checked={neurodivergentMode} onCheckedChange={setNeurodivergentMode} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Optimizes the app for neurodivergent individuals by enabling smaller habit increments, longer stabilization plateaus, and modular task capsules.
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
              <p className="text-muted-foreground">Set your timezone and general activity window.</p>
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
                <Layers className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Your Initial Habits</h2>
              <p className="text-muted-foreground">How many habits do you want to start with?</p>
            </div>
            <div className="space-y-4">
              <Slider
                min={1}
                max={5}
                step={1}
                value={[numHabitsToGenerate]}
                onValueChange={(val) => setNumHabitsToGenerate(val[0])}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 habit</span>
                <span className="font-bold text-foreground">{numHabitsToGenerate} habits</span>
                <span>5 habits</span>
              </div>
              <div className="p-4 bg-muted/50 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-blue-500" />
                    <Label className="font-bold">Foundational Routine?</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Prioritize habits that keep you grounded and consistent, like meditation or a simple daily task.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch checked={isFoundationalRoutine} onCheckedChange={setIsFoundationalRoutine} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If yes, we'll suggest habits that build a stable base.
                </p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Focus Areas</h2>
              <p className="text-muted-foreground">Which areas do you want to focus on?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {habitCategories.filter(cat => cat.value !== 'anchor').map((cat) => { // Exclude 'anchor' as it's handled by isFoundationalRoutine
                const Icon = cat.icon;
                const isSelected = selectedFocusAreas.includes(cat.value);
                return (
                  <div key={cat.value} className={cn(
                    "border rounded-xl p-3 cursor-pointer transition-all",
                    isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted/50'
                  )} onClick={() => toggleFocusArea(cat.value)}>
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
                      <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Growth Preferences</h2>
              <p className="text-muted-foreground">How do you prefer to build habits?</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <Label className="font-bold">Low-Pressure Start?</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Start habits in "Trial Mode" with no pressure to grow, focusing only on consistency.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch checked={isLowPressureStart} onCheckedChange={setIsLowPressureStart} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If yes, habits will start in Trial Mode, focusing on consistency over growth.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="sessionDuration">Session Duration Preference</Label>
                <Select value={sessionDurationPreference} onValueChange={(value: 'short' | 'medium' | 'long') => setSessionDurationPreference(value)}>
                  <SelectTrigger id="sessionDuration" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (5-15 min)</SelectItem>
                    <SelectItem value="medium">Medium (15-30 min)</SelectItem>
                    <SelectItem value="long">Long (30+ min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="weeklyFrequency">Weekly Commitment</Label>
                <Slider
                  min={1}
                  max={7}
                  step={1}
                  value={[weeklyFrequencyPreference]}
                  onValueChange={(val) => setWeeklyFrequencyPreference(val[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1x/week</span>
                  <span className="font-bold text-foreground">{weeklyFrequencyPreference} times per week</span>
                  <span>7x/week</span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-500" />
                    <Label className="font-bold">Comfort with Chunks?</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Break longer sessions into smaller, more manageable "capsules" to reduce overwhelm.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch checked={allowChunks} onCheckedChange={setAllowChunks} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If yes, longer sessions will be automatically broken into smaller parts.
                </p>
              </div>
            </div>
          </div>
        );
      case 6:
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

  const progress = (step / 6) * 100;

  const isNextDisabled = useMemo(() => {
    if (step === 1 && (!firstName.trim() || !lastName.trim())) return true;
    if (step === 4 && selectedFocusAreas.length === 0 && !isFoundationalRoutine) return true; // Allow skipping if foundational is true
    return false;
  }, [step, firstName, lastName, selectedFocusAreas, isFoundationalRoutine]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl rounded-3xl overflow-hidden border-0">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {step} of 6</div>
            <div className="text-xs font-bold text-primary">{Math.round(progress)}%</div>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
        </CardHeader>
        <CardContent className="py-8">
          {renderStep()}
          <div className="flex justify-between mt-8 gap-4">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="rounded-2xl px-8">Back</Button>
            <Button onClick={handleNext} disabled={isNextDisabled} className="flex-1 rounded-2xl h-12 text-base font-bold">
              {step === 6 ? 'Enter Growth Coach' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;