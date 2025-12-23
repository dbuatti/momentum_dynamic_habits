import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { CreateHabitParams } from '@/pages/HabitWizard';
import { HabitCategory } from '@/types/habit';

// Helper for time-of-day options
export const timeOfDayOptions = [
  { id: 'morning', label: 'Morning', icon: 'Sunrise', start: '06:00', end: '10:00' },
  { id: 'midday', label: 'Midday', icon: 'Sun', start: '10:00', end: '14:00' },
  { id: 'afternoon', label: 'Afternoon', icon: 'Sunset', start: '14:00', end: '18:00' },
  { id: 'evening', label: 'Evening', icon: 'Moon', start: '18:00', end: '22:00' },
  { id: 'anytime', label: 'Anytime / Flexible', icon: 'Clock', start: null, end: null },
];

export const calculateHabitParams = (data: Partial<WizardHabitData>, neurodivergentMode: boolean): Partial<CreateHabitParams> => {
  let dailyGoal = 15; // Default
  let frequency = 3; // Default

  // 1. Determine Daily Goal based on energy_per_session and unit
  const energyPerSession = data.energy_per_session_skipped ? 'moderate' : data.energy_per_session;
  if (data.unit === 'min') {
    if (energyPerSession === 'very_little') dailyGoal = 5;
    else if (energyPerSession === 'a_bit') dailyGoal = 10;
    else if (energyPerSession === 'moderate') dailyGoal = 20;
    else if (energyPerSession === 'plenty') dailyGoal = 30;
  } else if (data.unit === 'reps') {
    if (energyPerSession === 'very_little') dailyGoal = 5;
    else if (energyPerSession === 'a_bit') dailyGoal = 10;
    else if (energyPerSession === 'moderate') dailyGoal = 20;
    else if (energyPerSession === 'plenty') dailyGoal = 30;
  } else if (data.unit === 'dose') {
    dailyGoal = 1; // Doses are typically 1
  }

  // 2. Determine Weekly Frequency based on consistency_reality
  const consistencyReality = data.consistency_reality_skipped ? '3-4_days' : data.consistency_reality;
  if (consistencyReality === '1-2_days') frequency = 2;
  else if (consistencyReality === '3-4_days') frequency = 3;
  else if (consistencyReality === 'most_days') frequency = 5;
  else if (consistencyReality === 'daily') frequency = 7;

  // 3. Determine Habit Mode (Trial/Fixed/Growth)
  let isTrial = false;
  let isFixed = false;
  const emotionalCost = data.emotional_cost_skipped ? 'light' : data.emotional_cost;
  if (emotionalCost === 'heavy') isTrial = true; // High emotional cost suggests trial mode
  
  const growthAppetite = data.growth_appetite_skipped ? 'suggest' : data.growth_appetite;
  if (growthAppetite === 'steady') isFixed = true; // User wants no growth

  // 4. Determine Anchor Practice
  const motivationType = data.motivation_type_skipped ? 'personal_growth' : data.motivation_type;
  const anchorPractice = motivationType === 'routine_building' || motivationType === 'stress_reduction';

  // 5. Determine Auto-Chunking
  const autoChunking = energyPerSession === 'plenty' || energyPerSession === 'moderate';

  // 6. Determine XP and Energy Cost per Unit
  let xpPerUnit = 30;
  let energyCostPerUnit = 6;
  if (data.unit === 'reps') { xpPerUnit = 1; energyCostPerUnit = 0.5; }
  if (data.unit === 'dose') { xpPerUnit = 10; energyCostPerUnit = 0; }

  // 7. Determine Plateau Days Required
  let plateauDays = 7; // Default
  const confidenceCheck = data.confidence_check_skipped ? 5 : data.confidence_check;
  if (isTrial) {
    plateauDays = neurodivergentMode ? 14 : 7;
  } else if (isFixed) {
    plateauDays = 7; // Fixed habits still track consistency for 7 days
  } else { // Adaptive Growth mode
    if (confidenceCheck && confidenceCheck < 4) plateauDays = neurodivergentMode ? 10 : 7; // Longer for ND if low confidence
    else if (confidenceCheck && confidenceCheck > 7) plateauDays = neurodivergentMode ? 7 : 5; // Shorter for ND if high confidence
    else plateauDays = neurodivergentMode ? 10 : 7; // Default for ND growth
  }

  // 8. Determine Time Window
  let windowStart: string | null = null;
  let windowEnd: string | null = null;
  const timeOfDayFit = data.time_of_day_fit_skipped ? 'anytime' : data.time_of_day_fit;
  const selectedTimeOfDay = timeOfDayOptions.find(opt => opt.id === timeOfDayFit);
  if (selectedTimeOfDay) {
    windowStart = selectedTimeOfDay.start;
    windowEnd = selectedTimeOfDay.end;
  }

  // 9. Determine Carryover Enabled
  const safetyNetChoice = data.safety_net_choice_skipped ? 'none' : data.safety_net_choice;
  const carryoverEnabled = safetyNetChoice === 'rollover' || safetyNetChoice === 'gentle';

  return {
    name: data.name!,
    habit_key: data.habit_key!,
    category: data.category as HabitCategory,
    unit: data.unit || 'min',
    icon_name: data.icon_name || 'Target',
    short_description: data.short_description || '', // For templates
    
    current_daily_goal: dailyGoal,
    frequency_per_week: frequency,
    is_trial_mode: isTrial,
    is_fixed: isFixed,
    anchor_practice: anchorPractice,
    auto_chunking: autoChunking,
    xp_per_unit: xpPerUnit,
    energy_cost_per_unit: energyCostPerUnit,
    dependent_on_habit_id: data.dependent_on_habit_id || null, // Dependency is handled separately
    plateau_days_required: plateauDays,
    window_start: windowStart,
    window_end: windowEnd,
    carryover_enabled: carryoverEnabled,
  };
};