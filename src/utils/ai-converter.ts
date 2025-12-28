import { WizardHabitData } from '@/hooks/useUserHabitWizardTemp';

export const convertAIGeneratedToWizard = (aiData: any): Partial<WizardHabitData> => {
  return {
    name: aiData.name,
    habit_key: aiData.habit_key,
    category: aiData.category,
    unit: aiData.unit,
    daily_goal: aiData.daily_goal,
    frequency_per_week: aiData.frequency_per_week,
    motivation_type: aiData.motivation_type,
    energy_per_session: aiData.energy_per_session,
    consistency_reality: aiData.consistency_reality,
    emotional_cost: aiData.emotional_cost,
    time_of_day_fit: aiData.time_of_day_fit,
    barriers: aiData.barriers,
    icon_name: aiData.icon_name,
    short_description: aiData.short_description,
    measurement_type: aiData.measurement_type,
    is_trial_mode: aiData.is_trial_mode,
    is_fixed: aiData.is_fixed,
    anchor_practice: aiData.anchor_practice,
    auto_chunking: aiData.auto_chunking,
    xp_per_unit: aiData.xp_per_unit,
    energy_cost_per_unit: aiData.energy_cost_per_unit,
    dependent_on_habit_id: aiData.dependent_on_habit_id || null,
    plateau_days_required: aiData.plateau_days_required,
    window_start: aiData.window_start || null,
    window_end: aiData.window_end || null,
    carryover_enabled: aiData.carryover_enabled,
    weekly_session_min_duration: aiData.weekly_session_min_duration || aiData.daily_goal,
  };
};