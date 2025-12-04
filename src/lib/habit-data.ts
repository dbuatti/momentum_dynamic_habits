import { Habit, PianoHabit } from "../types/habit";

export const initialHabits: (Habit | PianoHabit)[] = [
  {
    id: "pushups",
    name: "Push-ups",
    type: "count",
    targetGoal: 1, // Updated from 10 to 1 rep
    unit: "reps",
    currentProgress: 0,
    momentum: "Building",
    route: "/log/pushups",
    xpPerUnit: 1, // 1 XP per push-up
    energyCostPerUnit: 0.5, // 0.5 energy per push-up
  },
  {
    id: "meditation",
    name: "Meditation",
    type: "time",
    targetGoal: 5, // Changed to 5 minutes (was 30 seconds)
    unit: "min", // Unit changed to minutes
    currentProgress: 0,
    momentum: "Building",
    route: "/log/meditation",
    xpPerUnit: 30, // 30 XP per minute (0.5 XP/sec * 60 sec/min)
    energyCostPerUnit: 6, // 6 energy per minute (0.1 energy/sec * 60 sec/min)
  },
  {
    id: "kinesiology",
    name: "Kinesiology Study",
    type: "time",
    targetGoal: 1, // Changed to 1 minute (was 30 seconds)
    unit: "min", // Unit changed to minutes
    currentProgress: 0,
    momentum: "Struggling",
    route: "/log/study",
    xpPerUnit: 42, // 42 XP per minute (0.7 XP/sec * 60 sec/min)
    energyCostPerUnit: 9, // 9 energy per minute (0.15 energy/sec * 60 sec/min)
  },
  {
    id: "piano",
    name: "Piano Practice",
    type: "time",
    targetGoal: 5, // Changed to 5 minutes (was 30 seconds)
    unit: "min", // Unit changed to minutes
    currentProgress: 0,
    momentum: "Strong",
    route: "/log/piano",
    xpPerUnit: 36, // 36 XP per minute (0.6 XP/sec * 60 sec/min)
    energyCostPerUnit: 7.2, // 7.2 energy per minute (0.12 energy/sec * 60 sec/min)
    targetSongs: ["Song A", "Song B", "Song C", "Song D", "Song E"],
    songsCompletedToday: [],
  } as PianoHabit,
];

export const getHabits = () => initialHabits;