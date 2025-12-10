import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { showError, showSuccess } from '@/utils/toast';
import { Dumbbell, Wind, BookOpen, Music, Home, Code, Target, Clock, User, Sparkles, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

const habitOptions = [
  { id: 'pushups', name: 'Push-ups', icon: Dumbbell, color: 'bg-habit-orange' },
  { id: 'meditation', name: 'Meditation', icon: Wind, color: 'bg-habit-blue' },
  { id: 'kinesiology', name: 'Kinesiology Study', icon: BookOpen, color: 'bg-habit-green' },
  { id: 'piano', name: 'Piano Practice', icon: Music, color: 'bg-habit-purple' },
  { id: 'housework', name: 'House Work', icon: Home, color: 'bg-habit-red' },
  { id: 'projectwork', name: 'Project Work', icon: Code, color: 'bg-habit-indigo' },
  { id: 'teeth_brushing', name: 'Brush Teeth', icon: Sparkles, color: 'bg-blue-100' },
  { id: 'medication', name: 'Take Medication', icon: Pill, color: 'bg-purple-100' },
];

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const { mutate: updateProfile } = useUpdateProfile();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId) 
        : [...prev, habitId]
    );
  };

  const handleComplete = async () => {
    try {
      updateProfile({
        first_name: firstName,
        last_name: lastName,
        timezone: selectedTimezone,
        default_auto_schedule_start_time: startTime,
        default_auto_schedule_end_time: endTime,
      });
      showSuccess('Welcome! Your profile has been set up.');
      onComplete();
    } catch (error) {
      showError('Failed to complete onboarding. Please try again.');
      console.error('Onboarding error:', error);
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
              <p className="text-muted-foreground">
                Let's set up your profile to get started with your journey.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="Enter your first name" 
                  className="h-12 rounded-xl" 
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder="Enter your last name" 
                  className="h-12 rounded-xl" 
                />
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
              <p className="text-muted-foreground">
                Set your timezone and preferred schedule times.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger id="timezone" className="h-12 rounded-xl">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger id="startTime" className="h-12 rounded-xl">
                      <SelectValue placeholder="Start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger id="endTime" className="h-12 rounded-xl">
                      <SelectValue placeholder="End time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
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
              <p className="text-muted-foreground">
                Select the habits you'd like to track. You can always add more later.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {habitOptions.map((habit) => {
                const Icon = habit.icon;
                const isSelected = selectedHabits.includes(habit.id);
                return (
                  <div 
                    key={habit.id} 
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${habit.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-medium text-center">{habit.name}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {selectedHabits.length} habit{selectedHabits.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-muted-foreground">
                Welcome to your growth journey, {firstName || 'there'}! Start building habits and tracking your progress.
              </p>
            </div>
            <div className="bg-accent rounded-lg p-4 text-left">
              <h3 className="font-semibold mb-2">Next Steps:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <span>Log your first habit from the dashboard</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <span>Check your progress in the history section</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <span>Earn XP and level up as you build consistency</span>
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Step {step} of 4
            </div>
            <div className="text-sm font-medium">
              {Math.round(progress)}%
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </CardHeader>
        <CardContent className="py-6">
          {renderStep()}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack} disabled={step === 1} className="rounded-xl">
              Back
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={
                (step === 1 && (!firstName.trim() || !lastName.trim())) ||
                (step === 3 && selectedHabits.length === 0)
              } 
              className="rounded-xl"
            >
              {step === 4 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};