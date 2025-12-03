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
    targetSongs: ["Song A", "Song B", "Song C", "Song D", "Song E"],
    songsCompletedToday: [],
  } as PianoHabit,
];

export const getHabits = () => initialHabits;