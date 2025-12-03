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
    targetGoal: 30, // Updated from 5 minutes to 30 seconds
    unit: "seconds", // Unit changed for clarity
    currentProgress: 0,
    momentum: "Building",
    route: "/log/meditation",
    xpPerUnit: 0.5, // 0.5 XP per second of meditation
    energyCostPerUnit: 0.1, // 0.1 energy per second of meditation
  },
  {
    id: "kinesiology",
    name: "Kinesiology Study",
    type: "time",
    targetGoal: 30, // Updated from 1 minute to 30 seconds
    unit: "seconds", // Unit changed for clarity
    currentProgress: 0,
    momentum: "Struggling",
    route: "/log/study",
    xpPerUnit: 0.7, // 0.7 XP per second of study
    energyCostPerUnit: 0.15, // 0.15 energy per second of study
  },
  {
    id: "piano",
    name: "Piano Practice",
    type: "time",
    targetGoal: 30, // Updated from 5 minutes to 30 seconds
    unit: "seconds", // Unit changed for clarity
    currentProgress: 0,
    momentum: "Strong",
    route: "/log/piano",
    xpPerUnit: 0.6, // 0.6 XP per second of piano practice
    energyCostPerUnit: 0.12, // 0.12 energy per second of piano practice
    targetSongs: ["Song A", "Song B", "Song C", "Song D", "Song E"],
    songsCompletedToday: [],
  } as PianoHabit,
];

export const getHabits = () => initialHabits;