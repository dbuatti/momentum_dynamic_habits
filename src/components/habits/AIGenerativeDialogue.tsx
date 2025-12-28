"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sparkles, 
  MessageSquare, 
  Target, 
  Clock, 
  Zap, 
  Anchor, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Brain,
  Heart,
  Calendar,
  Dumbbell,
  Wind,
  BookOpen,
  Music,
  Home,
  Pill,
  Sparkle,
  X,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { habitTemplates, habitCategories } from '@/lib/habit-templates';
import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { useJourneyData } from '@/hooks/useJourneyData';

interface AIGenerativeDialogueProps {
  onHabitGenerated: (habitData: Partial<WizardHabitData>) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface AIParsedResult {
  name: string;
  category: string;
  unit: 'min' | 'reps' | 'dose';
  daily_goal: number;
  frequency_per_week: number;
  motivation_type: string;
  energy_per_session: string;
  consistency_reality: string;
  emotional_cost: string;
  time_of_day_fit: string;
  barriers: string[];
  icon_name: string;
  short_description: string;
  confidence: number;
  reasoning: string;
  // NEW: Weekly goal fields
  weekly_goal_enabled: boolean;
  weekly_goal_target: number;
}

const AIGenerativeDialogue: React.FC<AIGenerativeDialogueProps> = ({ onHabitGenerated, isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<AIParsedResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { data: journeyData } = useJourneyData();
  const neurodivergentMode = journeyData?.profile?.neurodivergent_mode || false;

  const keywordMap = {
    cognitive: ['study', 'learn', 'read', 'focus', 'work', 'project', 'code', 'write', 'think', 'brain', 'mental'],
    physical: ['exercise', 'workout', 'run', 'walk', 'gym', 'pushup', 'yoga', 'stretch', 'move', 'fitness'],
    wellness: ['meditate', 'mindfulness', 'sleep', 'rest', 'breathe', 'calm', 'stress', 'anxiety', 'health', 'wellness', 'medication', 'pill'],
    daily: ['clean', 'cook', 'chores', 'house', 'task', 'habit', 'routine', 'daily', 'organize'],
    anchor: ['anchor', 'foundation', 'core', 'essential', 'priority', 'non-negotiable', 'morning', 'evening', 'routine'],
    stress_reduction: ['stress', 'anxiety', 'overwhelm', 'pressure', 'calm', 'relax', 'peace', 'mental health'],
    skill_development: ['learn', 'skill', 'improve', 'better', 'grow', 'develop', 'master', 'practice'],
    health_improvement: ['health', 'fit', 'strong', 'energy', 'vitality', 'wellness', 'physical', 'body'],
    routine_building: ['routine', 'habit', 'consistency', 'daily', 'every day', 'regular', 'structure'],
    personal_growth: ['grow', 'better', 'improve', 'develop', 'evolve', 'progress', 'change'],
    creative_expression: ['create', 'art', 'music', 'write', 'paint', 'draw', 'express', 'creative'],
    very_little: ['easy', 'simple', 'quick', 'light', 'small', 'minimal', 'effortless', 'gentle'],
    a_bit: ['moderate', 'manageable', 'reasonable', 'doable', 'okay'],
    moderate: ['challenging', 'hard', 'tough', 'solid', 'good'],
    plentiful: ['intense', 'hardcore', 'serious', 'dedicated', 'full', 'complete'],
    '1-2_days': ['sometimes', 'occasional', 'rarely', 'weekend', 'sporadic'],
    '3-4_days': ['often', 'regular', 'frequent', 'several times'],
    'most_days': ['almost daily', 'most days', 'consistent', 'regularly'],
    'daily_freq': ['every day', 'daily', 'always', 'without fail', 'religiously'],
    light: ['love', 'enjoy', 'fun', 'easy', 'natural', 'effortless'],
    some_resistance: ['hard', 'struggle', 'effort', 'work', 'discipline'],
    heavy: ['hate', 'dread', 'avoid', 'procrastinate', 'difficult', 'painful'],
    morning: ['morning', 'am', 'wake', 'early', 'sunrise', 'dawn'],
    midday: ['noon', 'lunch', 'midday', 'afternoon'],
    evening: ['evening', 'night', 'pm', 'dusk', 'sunset', 'before bed'],
    anytime: ['anytime', 'flexible', 'whenever', 'no preference', 'any time'],
    forgetting: ['forget', 'memory', 'remember', 'out of sight', 'remind'],
    time_pressure: ['time', 'busy', 'schedule', 'calendar', 'overbooked'],
    overwhelm: ['overwhelm', 'too much', 'big', 'scary', 'intimidating'],
    perfectionism: ['perfect', 'all or nothing', 'fear of failure', 'mistake'],
    mood: ['mood', 'energy', 'tired', 'exhausted', 'drained'],
    boredom: ['boring', 'dull', 'repetitive', 'monotonous'],
    Dumbbell: ['pushup', 'gym', 'workout', 'strength', 'muscle', 'lift', 'exercise'],
    Wind: ['meditate', 'breath', 'mindfulness', 'calm', 'yoga', 'breathe'],
    BookOpen: ['study', 'read', 'learn', 'book', 'education', 'knowledge'],
    Music: ['music', 'piano', 'guitar', 'practice', 'instrument', 'song'],
    Home: ['clean', 'house', 'chores', 'organize', 'home', 'tidy'],
    Pill: ['medication', 'pill', 'medicine', 'vitamin', 'supplement'],
    Sparkles: ['teeth', 'brush', 'hygiene', 'groom', 'clean'],
    Target: ['goal', 'focus', 'aim', 'target', 'objective'],
    Heart: ['self care', 'love', 'kindness', 'compassion', 'mental health'],
    Zap: ['energy', 'power', 'strength', 'vigor', 'active'],
    Anchor: ['anchor', 'foundation', 'core', 'essential', 'priority'],
    // NEW: Weekly goal keywords
    weekly: ['weekly', 'per week', 'total per week', 'by the end of the week', 'over the week'],
  };

  const analyzeInput = (text: string): AIParsedResult => {
    const lowerText = text.toLowerCase();
    let confidence = 50;
    const reasoning: string[] = [];

    const nameMatch = text.match(/I want to ([^.]+)/i) || 
                      text.match(/I should ([^.]+)/i) || 
                      text.match(/I need to ([^.]+)/i) || 
                      text.match(/I will ([^.]+)/i) ||
                      text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    
    let name = nameMatch ? nameMatch[1] || nameMatch[0] : text.split(' ').slice(0, 4).join(' ');
    name = name.replace(/^(I want to |I should |I need to |I will )/i, '').trim();
    name = name.charAt(0).toUpperCase() + name.slice(1);

    let category = 'daily';
    let icon_name = 'Target';
    for (const [cat, keywords] of Object.entries(keywordMap)) {
      if (['cognitive', 'physical', 'wellness', 'daily', 'anchor'].includes(cat)) {
        if (keywords.some(k => lowerText.includes(k))) {
          category = cat;
          confidence += 10;
          reasoning.push(`Detected category: ${cat}`);
          
          if (cat === 'physical') icon_name = 'Dumbbell';
          else if (cat === 'wellness') icon_name = 'Wind';
          else if (cat === 'cognitive') icon_name = 'BookOpen';
          else if (cat === 'daily') icon_name = 'Home';
          else if (cat === 'anchor') icon_name = 'Anchor';
          break;
        }
      }
    }

    let unit: 'min' | 'reps' | 'dose' = 'min';
    let daily_goal = 15;
    
    const timeMatch = text.match(/(\d+)\s*(minute|min|hour|hr)/i);
    const repsMatch = text.match(/(\d+)\s*(rep|reps|time|times|set|sets)/i);
    const doseMatch = text.match(/(\d+)\s*(dose|pill|pills|tablet|tablets)/i);

    if (timeMatch) {
      const amount = parseInt(timeMatch[1]);
      const unitText = timeMatch[2].toLowerCase();
      daily_goal = unitText === 'hour' || unitText === 'hr' ? amount * 60 : amount;
      unit = 'min';
      confidence += 15;
      reasoning.push(`Detected time goal: ${daily_goal} minutes`);
    } else if (repsMatch) {
      daily_goal = parseInt(repsMatch[1]);
      unit = 'reps';
      confidence += 15;
      reasoning.push(`Detected reps goal: ${daily_goal} reps`);
    } else if (doseMatch) {
      daily_goal = parseInt(doseMatch[1]);
      unit = 'dose';
      confidence += 15;
      reasoning.push(`Detected dose goal: ${daily_goal} doses`);
    } else {
      if (category === 'physical') { daily_goal = 20; unit = 'min'; }
      else if (category === 'wellness') { daily_goal = 10; unit = 'min'; }
      else if (category === 'cognitive') { daily_goal = 25; unit = 'min'; }
      else if (category === 'daily') { daily_goal = 10; unit = 'min'; }
      else if (category === 'anchor') { daily_goal = 5; unit = 'min'; }
    }

    let frequency_per_week = 3;
    if (lowerText.includes('every day') || lowerText.includes('daily')) {
      frequency_per_week = 7;
      confidence += 10;
      reasoning.push('Detected daily frequency');
    } else if (lowerText.includes('every other day') || lowerText.includes('alternate')) {
      frequency_per_week = 4;
      confidence += 10;
      reasoning.push('Detected alternate day frequency');
    } else if (lowerText.includes('weekend')) {
      frequency_per_week = 2;
      confidence += 10;
      reasoning.push('Detected weekend frequency');
    } else if (lowerText.includes('often') || lowerText.includes('frequently')) {
      frequency_per_week = 5;
      confidence += 5;
      reasoning.push('Detected frequent frequency');
    } else if (lowerText.includes('sometimes') || lowerText.includes('occasional')) {
      frequency_per_week = 2;
      confidence += 5;
      reasoning.push('Detected occasional frequency');
    }

    let motivation_type = 'personal_growth';
    for (const [mot, keywords] of Object.entries(keywordMap)) {
      if (['stress_reduction', 'skill_development', 'health_improvement', 'routine_building', 'personal_growth', 'creative_expression'].includes(mot)) {
        if (keywords.some(k => lowerText.includes(k))) {
          motivation_type = mot;
          confidence += 10;
          reasoning.push(`Detected motivation: ${mot}`);
          break;
        }
      }
    }

    let energy_per_session = 'moderate';
    if (keywordMap.very_little.some(k => lowerText.includes(k))) {
      energy_per_session = 'very_little';
      confidence += 5;
      reasoning.push('Detected low energy preference');
    } else if (keywordMap.a_bit.some(k => lowerText.includes(k))) {
      energy_per_session = 'a_bit';
      confidence += 5;
      reasoning.push('Detected moderate energy preference');
    } else if (keywordMap.plentiful.some(k => lowerText.includes(k))) {
      energy_per_session = 'plentiful';
      confidence += 5;
      reasoning.push('Detected high energy preference');
    }

    let consistency_reality = '3-4_days';
    if (keywordMap['1-2_days'].some(k => lowerText.includes(k))) {
      consistency_reality = '1-2_days';
      confidence += 5;
      reasoning.push('Detected low consistency expectation');
    } else if (keywordMap['most_days'].some(k => lowerText.includes(k))) {
      consistency_reality = 'most_days';
      confidence += 5;
      reasoning.push('Detected high consistency expectation');
    } else if (keywordMap['daily_freq'].some(k => lowerText.includes(k))) {
      consistency_reality = 'daily';
      confidence += 5;
      reasoning.push('Detected daily consistency expectation');
    }

    let emotional_cost = 'light';
    if (keywordMap.heavy.some(k => lowerText.includes(k))) {
      emotional_cost = 'heavy';
      confidence += 5;
      reasoning.push('Detected high emotional resistance');
    } else if (keywordMap.some_resistance.some(k => lowerText.includes(k))) {
      emotional_cost = 'some_resistance';
      confidence += 5;
      reasoning.push('Detected moderate emotional resistance');
    } else if (keywordMap.light.some(k => lowerText.includes(k))) {
      emotional_cost = 'light';
      confidence += 5;
      reasoning.push('Detected low emotional resistance');
    }

    let time_of_day_fit = 'anytime';
    if (keywordMap.morning.some(k => lowerText.includes(k))) {
      time_of_day_fit = 'morning';
      confidence += 5;
      reasoning.push('Detected morning preference');
    } else if (keywordMap.midday.some(k => lowerText.includes(k))) {
      time_of_day_fit = 'midday';
      confidence += 5;
      reasoning.push('Detected midday preference');
    } else if (keywordMap.evening.some(k => lowerText.includes(k))) {
      time_of_day_fit = 'evening';
      confidence += 5;
      reasoning.push('Detected evening preference');
    }

    const barriers: string[] = [];
    if (keywordMap.forgetting.some(k => lowerText.includes(k))) {
      barriers.push('forgetting');
      confidence += 5;
      reasoning.push('Detected forgetting barrier');
    }
    if (keywordMap.time_pressure.some(k => lowerText.includes(k))) {
      barriers.push('time_pressure');
      confidence += 5;
      reasoning.push('Detected time pressure barrier');
    }
    if (keywordMap.overwhelm.some(k => lowerText.includes(k))) {
      barriers.push('overwhelm');
      confidence += 5;
      reasoning.push('Detected overwhelm barrier');
    }
    if (keywordMap.perfectionism.some(k => lowerText.includes(k))) {
      barriers.push('perfectionism');
      confidence += 5;
      reasoning.push('Detected perfectionism barrier');
    }
    if (keywordMap.mood.some(k => lowerText.includes(k))) {
      barriers.push('mood');
      confidence += 5;
      reasoning.push('Detected mood/energy barrier');
    }
    if (keywordMap.boredom.some(k => lowerText.includes(k))) {
      barriers.push('boredom');
      confidence += 5;
      reasoning.push('Detected boredom barrier');
    }

    if (icon_name === 'Target') {
      for (const [icon, keywords] of Object.entries(keywordMap)) {
        if (['Dumbbell', 'Wind', 'BookOpen', 'Music', 'Home', 'Pill', 'Sparkles', 'Target', 'Heart', 'Zap', 'Anchor'].includes(icon)) {
          if (keywords.some(k => lowerText.includes(k))) {
            icon_name = icon;
            confidence += 5;
            reasoning.push(`Detected icon: ${icon}`);
            break;
          }
        }
      }
    }

    const short_description = `A ${category} habit focused on ${motivation_type.replace('_', ' ')}.`;
    confidence = Math.min(confidence, 100);

    // NEW: Weekly goal detection
    const weeklyGoalEnabled = keywordMap.weekly.some(k => lowerText.includes(k));
    let weeklyGoalTarget = 0;
    if (weeklyGoalEnabled) {
      // If weekly goal is mentioned, calculate target based on daily goal and frequency
      weeklyGoalTarget = daily_goal * frequency_per_week;
      confidence += 10;
      reasoning.push('Detected weekly goal preference');
    }

    return {
      name,
      category,
      unit,
      daily_goal,
      frequency_per_week,
      motivation_type,
      energy_per_session,
      consistency_reality,
      emotional_cost,
      time_of_day_fit,
      barriers,
      icon_name,
      short_description,
      confidence,
      reasoning: reasoning.join(', '),
      weekly_goal_enabled: weeklyGoalEnabled,
      weekly_goal_target: weeklyGoalTarget,
    };
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setShowResult(false);
    setParsedResult(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = analyzeInput(input);
    setParsedResult(result);
    setShowResult(true);
    setIsAnalyzing(false);
  };

  const handleAccept = () => {
    if (!parsedResult) return;

    const wizardData: Partial<WizardHabitData> = {
      name: parsedResult.name,
      habit_key: parsedResult.name.toLowerCase().replace(/\s/g, '_').replace(/[^a-z0-9_]/g, ''),
      category: parsedResult.category,
      unit: parsedResult.unit,
      daily_goal: parsedResult.daily_goal,
      frequency_per_week: parsedResult.frequency_per_week,
      motivation_type: parsedResult.motivation_type as any,
      energy_per_session: parsedResult.energy_per_session as any,
      consistency_reality: parsedResult.consistency_reality as any,
      emotional_cost: parsedResult.emotional_cost as any,
      time_of_day_fit: parsedResult.time_of_day_fit as any,
      barriers: parsedResult.barriers,
      icon_name: parsedResult.icon_name,
      short_description: parsedResult.short_description,
      measurement_type: parsedResult.unit === 'min' ? 'timer' : (parsedResult.unit === 'dose' ? 'binary' : 'unit'),
      is_trial_mode: parsedResult.emotional_cost === 'heavy' || parsedResult.confidence < 60,
      is_fixed: parsedResult.unit === 'dose',
      anchor_practice: parsedResult.category === 'anchor',
      auto_chunking: true,
      xp_per_unit: parsedResult.unit === 'min' ? 30 : (parsedResult.unit === 'reps' ? 1 : 10),
      energy_cost_per_unit: parsedResult.unit === 'min' ? 6 : (parsedResult.unit === 'reps' ? 0.5 : 0),
      plateau_days_required: parsedResult.emotional_cost === 'heavy' ? 14 : 7,
      window_start: null,
      window_end: null,
      carryover_enabled: false,
      weekly_session_min_duration: parsedResult.daily_goal,
      // NEW: Weekly goal fields
      weekly_goal_enabled: parsedResult.weekly_goal_enabled,
      weekly_goal_target: parsedResult.weekly_goal_target,
      weekly_goal_unit: parsedResult.unit,
    };

    onHabitGenerated(wizardData);
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="rounded-3xl shadow-2xl overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">AI Habit Generator</CardTitle>
                  <p className="text-xs text-muted-foreground">Describe your goal in natural language</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!showResult && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Textarea
                    placeholder="Try: 'I want to meditate for 10 minutes every morning to reduce stress' or 'I need to do 20 push-ups daily to get stronger'"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="min-h-[120px] rounded-2xl text-base p-4 pr-12 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAnalyze();
                      }
                    }}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full h-8 w-8"
                      onClick={() => setInput('')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Press Cmd/Ctrl + Enter to analyze
                  </p>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!input.trim() || isAnalyzing}
                    className="rounded-xl px-6"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-semibold">Analyzing your input...</p>
                <p className="text-sm text-muted-foreground">Processing natural language patterns</p>
              </motion.div>
            )}

            {showResult && parsedResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className={cn(
                  "rounded-2xl p-4 border flex items-center justify-between",
                  getConfidenceColor(parsedResult.confidence)
                )}>
                  <div className="flex items-center gap-3">
                    <Sparkle className="w-5 h-5" />
                    <div>
                      <p className="font-bold text-sm">{getConfidenceLabel(parsedResult.confidence)}</p>
                      <p className="text-xs opacity-75">{parsedResult.confidence}% match</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setShowResult(false)}
                  >
                    Try Again
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Generated Habit
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Name</p>
                      <p className="font-semibold">{parsedResult.name}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Category</p>
                      <p className="font-semibold capitalize">{parsedResult.category}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Daily Goal</p>
                      <p className="font-semibold">{parsedResult.daily_goal} {parsedResult.unit}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Frequency</p>
                      <p className="font-semibold">{parsedResult.frequency_per_week}x/week</p>
                    </div>
                  </div>

                  {/* NEW: Weekly Goal Display */}
                  {parsedResult.weekly_goal_enabled && (
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase">Weekly Goal</span>
                      </div>
                      <span className="font-bold text-primary">
                        {parsedResult.weekly_goal_target} {parsedResult.unit} / week
                      </span>
                    </div>
                  )}

                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
                    <p className="text-xs font-bold text-primary uppercase">AI Insights</p>
                    <p className="text-sm">{parsedResult.short_description}</p>
                    <p className="text-xs text-muted-foreground italic">
                      Based on: {parsedResult.reasoning}
                    </p>
                  </div>

                  {(parsedResult.barriers.length > 0 || parsedResult.emotional_cost === 'heavy') && (
                    <div className="bg-warning/10 p-4 rounded-xl border border-warning/20 space-y-2">
                      <p className="text-xs font-bold text-warning uppercase">Smart Adjustments</p>
                      <ul className="text-sm space-y-1">
                        {parsedResult.emotional_cost === 'heavy' && (
                          <li>• Starting in <strong>Trial Mode</strong> to reduce pressure</li>
                        )}
                        {parsedResult.barriers.includes('forgetting') && (
                          <li>• Will set <strong>time-window reminders</strong></li>
                        )}
                        {parsedResult.barriers.includes('overwhelm') && (
                          <li>• Auto-<strong>chunking enabled</strong> for large goals</li>
                        )}
                        {parsedResult.barriers.includes('time_pressure') && (
                          <li>• Flexible scheduling with <strong>carryover</strong></li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAccept}
                    className="flex-1 rounded-xl h-12 text-base font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Create This Habit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowResult(false)}
                    className="rounded-xl h-12"
                  >
                    Edit Manually
                  </Button>
                </div>
              </motion.div>
            )}

            {!showResult && !isAnalyzing && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Examples to try:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    className="h-16 rounded-xl justify-start text-left px-3 py-2 hover:bg-primary/5"
                    onClick={() => setInput('I want to meditate for 10 minutes every morning to reduce stress and anxiety')}
                  >
                    <Wind className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-xs">"Meditate 10 min daily for stress"</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-16 rounded-xl justify-start text-left px-3 py-2 hover:bg-primary/5"
                    onClick={() => setInput('I need to do 20 push-ups daily to get stronger and build muscle')}
                  >
                    <Dumbbell className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-xs">"20 push-ups daily for strength"</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-16 rounded-xl justify-start text-left px-3 py-2 hover:bg-primary/5"
                    onClick={() => setInput('I should read for 30 minutes before bed to improve my knowledge')}
                  >
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-xs">"Read 30 min before bed"</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-16 rounded-xl justify-start text-left px-3 py-2 hover:bg-primary/5"
                    onClick={() => setInput('I want to brush my teeth twice daily for dental health')}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-xs">"Brush teeth twice daily"</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AIGenerativeDialogue;