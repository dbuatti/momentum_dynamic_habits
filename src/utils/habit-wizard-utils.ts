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
  if (data.unit === 'min') {
    if (data.energy_per_session === 'very_little') dailyGoal = 5;
    else if (data.energy_per_session === 'a_bit') dailyGoal = 10;
    else if (data.energy_per_session === 'moderate') dailyGoal = 20;
    else if (data.energy_per_session === 'plenty') dailyGoal = 30;
  } else if (data.unit === 'reps') {
    if (data.energy_per_session === 'very_little') dailyGoal = 5;
    else if (data.energy_per_session === 'a_bit') dailyGoal = 10;
    else if (data.energy_per_session === 'moderate') dailyGoal = 20;
    else if (data.energy_per_session === 'plenty') dailyGoal = 30;
  } else if (data.unit === 'dose') {
    dailyGoal = 1; // Doses are typically 1
  }

  // 2. Determine Weekly Frequency based on consistency_reality
  if (data.consistency_reality === '1-2_days') frequency = 2;
  else if (data.consistency_reality === '3-4_days') frequency = 3;
  else if (data.consistency_reality === 'most_days') frequency = 5;
  else if (data.consistency_reality === 'daily') frequency = 7;

  // 3. Determine Habit Mode (Trial/Fixed/Growth)
  let isTrial = false;
  let isFixed = false;
  if (data.emotional_cost === 'heavy') isTrial = true; // High emotional cost suggests trial mode
  if (data.growth_appetite === 'steady') isFixed = true; // User wants no growth

  // 4. Determine Anchor Practice
  const anchorPractice = data.motivation_type === 'routine_building' || data.motivation_type === 'stress_reduction';

  // 5. Determine Auto-Chunking
  const autoChunking = data.energy_per_session === 'plenty' || data.energy_per_session === 'moderate';

  // 6. Determine XP and Energy Cost per Unit
  let xpPerUnit = 30;
  let energyCostPerUnit = 6;
  if (data.unit === 'reps') { xpPerUnit = 1; energyCostPerUnit = 0.5; }
  if (data.unit === 'dose') { xpPerUnit = 10; energyCostPerUnit = 0; }

  // 7. Determine Plateau Days Required
  let plateauDays = 7; // Default
  if (isTrial) {
    plateauDays = neurodivergentMode ? 14 : 7;
  } else if (isFixed) {
    plateauDays = 7; // Fixed habits still track consistency for 7 days
  } else { // Adaptive Growth mode
    const confidence = data.confidence_check || 5;
    if (confidence < 4) plateauDays = neurodivergentMode ? 10 : 7; // Longer for ND if low confidence
    else if (confidence > 7) plateauDays = neurodivergentMode ? 7 : 5; // Shorter for ND if high confidence
    else plateauDays = neurodivergentMode ? 10 : 7; // Default for ND growth
  }

  // 8. Determine Time Window
  let windowStart: string | null = null;
  let windowEnd: string | null = null;
  const selectedTimeOfDay = timeOfDayOptions.find(opt => opt.id === data.time_of_day_fit);
  if (selectedTimeOfDay) {
    windowStart = selectedTimeOfDay.start;
    windowEnd = selectedTimeOfDay.end;
  }

  // 9. Determine Carryover Enabled
  const carryoverEnabled = data.safety_net_choice === 'rollover' || data.safety_net_choice === 'gentle';

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
    dependent_on_habit_id: data.dependent_on_habit_id || null,
    plateau_days_required: plateauDays,
    window_start: windowStart,
    window_end: windowEnd,
    carryover_enabled: carryoverEnabled,
  };
};