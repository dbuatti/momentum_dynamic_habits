import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';
import { CreateHabitParams } from '@/pages/HabitWizard';
import { HabitCategory, MeasurementType, GrowthType, ChunkingMode } from '@/types/habit';

export const timeOfDayOptions = [
  { id: 'morning', label: 'Morning', icon: 'Sunrise', start: '06:00', end: '10:00' },
  { id: 'midday', label: 'Midday', icon: 'Sun', start: '10:00', end: '14:00' },
  { id: 'afternoon', label: 'Afternoon', icon: 'Sunset', start: '14:00', end: '18:00' },
  { id: 'evening', label: 'Evening', icon: 'Moon', start: '18:00', end: '22:00' },
  { id: 'anytime', label: 'Anytime / Flexible', icon: 'Clock', start: null, end: null },
];

export const calculateHabitParams = (data: Partial<WizardHabitData>, neurodivergentMode: boolean): Partial<CreateHabitParams> => {
  let dailyGoal = 15;
  let frequency = 3;

  const energyPerSession = data.energy_per_session_skipped ? 'moderate' : data.energy_per_session;
  const unit = data.unit || 'min';
  
  let measurementType: MeasurementType = data.measurement_type || 'timer';
  if (!data.measurement_type) {
    if (unit === 'min') measurementType = 'timer';
    else if (unit === 'reps') measurementType = 'unit';
    else if (unit === 'dose') measurementType = 'binary';
  }

  let growthType: GrowthType = 'fixed';
  let growthValue = 1;

  if (unit === 'min') {
    if (energyPerSession === 'very_little') dailyGoal = 5;
    else if (energyPerSession === 'a_bit') dailyGoal = 10;
    else if (energyPerSession === 'moderate') dailyGoal = 20;
    else if (energyPerSession === 'plenty') dailyGoal = 30;
    
    growthType = 'percentage';
    growthValue = neurodivergentMode ? 10 : 20;
  } else if (unit === 'reps') {
    if (energyPerSession === 'very_little') dailyGoal = 5;
    else if (energyPerSession === 'a_bit') dailyGoal = 10;
    else if (energyPerSession === 'moderate') dailyGoal = 20;
    else if (energyPerSession === 'plenty') dailyGoal = 30;
    
    growthType = 'fixed';
    growthValue = neurodivergentMode ? 1 : 2;
  } else if (unit === 'dose') {
    dailyGoal = 1;
    growthType = 'fixed';
    growthValue = 0;
  }

  const consistencyReality = data.consistency_reality_skipped ? '3-4_days' : data.consistency_reality;
  if (consistencyReality === '1-2_days') frequency = 2;
  else if (consistencyReality === '3-4_days') frequency = 3;
  else if (consistencyReality === 'most_days') frequency = 5;
  else if (consistencyReality === 'daily') frequency = 7;

  let isTrial = false;
  let isFixed = false;
  const emotionalCost = data.emotional_cost_skipped ? 'light' : data.emotional_cost;
  if (emotionalCost === 'heavy') isTrial = true;
  
  const growthAppetite = data.growth_appetite_skipped ? 'suggest' : data.growth_appetite;
  if (growthAppetite === 'steady') isFixed = true;

  const motivationType = data.motivation_type_skipped ? 'personal_growth' : data.motivation_type;
  const anchorPractice = motivationType === 'routine_building' || motivationType === 'stress_reduction';

  // Intelligent Chunking initialization
  const enableChunks = measurementType !== 'binary' && dailyGoal > 5;
  const chunkingMode: ChunkingMode = 'auto';

  let xpPerUnit = 30;
  let energyCostPerUnit = 6;
  if (unit === 'reps') { xpPerUnit = 1; energyCostPerUnit = 0.5; }
  if (unit === 'dose') { xpPerUnit = 10; energyCostPerUnit = 0; }

  let plateauDays = 7;
  const confidenceCheck = data.confidence_check_skipped ? 5 : data.confidence_check;
  if (isTrial) {
    plateauDays = neurodivergentMode ? 14 : 7;
  } else if (isFixed) {
    plateauDays = 7;
  } else {
    if (confidenceCheck && confidenceCheck < 4) plateauDays = neurodivergentMode ? 10 : 7;
    else if (confidenceCheck && confidenceCheck > 7) plateauDays = neurodivergentMode ? 7 : 5;
    else plateauDays = neurodivergentMode ? 10 : 7;
  }

  let windowStart: string | null = null;
  let windowEnd: string | null = null;
  const timeOfDayFit = data.time_of_day_fit_skipped ? 'anytime' : data.time_of_day_fit;
  const selectedTimeOfDay = timeOfDayOptions.find(opt => opt.id === timeOfDayFit);
  if (selectedTimeOfDay) {
    windowStart = selectedTimeOfDay.start;
    windowEnd = selectedTimeOfDay.end;
  }

  const safetyNetChoice = data.safety_net_choice_skipped ? 'none' : data.safety_net_choice;
  const carryoverEnabled = safetyNetChoice === 'rollover' || safetyNetChoice === 'gentle';
  
  let weeklySessionMinDuration = 10; 
  if (unit === 'min') {
    weeklySessionMinDuration = dailyGoal;
  } else if (unit === 'reps' || unit === 'dose') {
    weeklySessionMinDuration = dailyGoal;
  }

  return {
    name: data.name!,
    habit_key: data.habit_key!,
    category: data.category as HabitCategory,
    unit: unit,
    measurement_type: measurementType,
    icon_name: data.icon_name || 'Target',
    short_description: data.short_description || '',
    current_daily_goal: dailyGoal,
    frequency_per_week: frequency,
    is_trial_mode: isTrial,
    is_fixed: isFixed,
    anchor_practice: anchorPractice,
    auto_chunking: true, 
    enable_chunks: enableChunks,
    chunking_mode: chunkingMode,
    xp_per_unit: xpPerUnit,
    energy_cost_per_unit: energyCostPerUnit,
    dependent_on_habit_id: data.dependent_on_habit_id || null,
    plateau_days_required: plateauDays,
    window_start: windowStart,
    window_end: windowEnd,
    carryover_enabled: carryoverEnabled,
    growth_type: growthType,
    growth_value: growthValue,
    weekly_session_min_duration: weeklySessionMinDuration,
    complete_on_finish: data.complete_on_finish ?? true,
    is_weekly_goal: data.is_weekly_goal ?? false,
  };
};