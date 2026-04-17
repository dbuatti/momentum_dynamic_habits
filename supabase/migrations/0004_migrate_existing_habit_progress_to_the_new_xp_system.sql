UPDATE user_habits SET habit_xp = completions_in_plateau;
UPDATE user_habits SET habit_level = 1; -- Everyone starts at level 1, but with some XP
-- Recalculate levels based on XP (optional, but good)
-- Since we don't have the formula in SQL easily, we'll just let them level up on their next completion.
