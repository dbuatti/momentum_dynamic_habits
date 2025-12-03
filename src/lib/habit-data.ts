import { Habit, PianoHabit } from "../types/habit";

export const initialHabits: (Habit | PianoHabit)[] = [
  {
    id: "pushups",
    name: "Push-ups",
    type: "count",
    targetGoal: 10, // Adaptive to 100/day
    unit: "reps",
    currentProgress: 0,
    momentum: "Building",
    route: "/log/pushups",
  },
  {
    id: "meditation",
    name: "Meditation",
    type: "time",
    targetGoal: 5, // Adaptive to 60 mins/day
    unit: "minutes",
    currentProgress: 0,
    momentum: "Building",
    route: "/log/meditation",
  },
  {
    id: "kinesiology",
    name: "Kinesiology Study",
    type: "time",
    targetGoal: 1, // Adaptive to 60 mins/day (starting low)
    unit: "minutes",
    currentProgress: 0,
    momentum: "Struggling",
    route: "/log/study",
  },
  {
    id: "piano",
    name: "Piano Practice",
    type: "time",
    targetGoal: 5, // Adaptive time goal
    unit: "minutes",
    currentProgress: 0,
    momentum: "Strong",
    route: "/log/piano",
    targetSongs: ["Song A", "Song B", "Song C", "Song D", "Song E"],
    songsCompletedToday: [],
  } as PianoHabit,
];

export const getHabits = () => initialHabits;