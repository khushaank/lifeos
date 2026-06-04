import type { LogEntry } from "@/store/useLifeStore";

export interface CheckInFormState {
  moodScore: number;
  sleepHours: number;
  sleepQuality: number;
  energyLevel: number;
  focusLevel: number;
  productivityLevel: number;
  stressLevel: number;
  waterIntake: number;
  junkFood: boolean;
  socialInteraction: number;
  workoutDone: boolean;
  exerciseDuration: number;
  workoutType: string;
  pagesRead: number;
  bookName: string;
  studyHours: number;
  studyTopic: string;
  notes: string;
  wins: string;
  challenges: string;
}

export const DEFAULT_CHECK_IN_FORM: CheckInFormState = {
  moodScore: 5,
  sleepHours: 7.5,
  sleepQuality: 7,
  energyLevel: 7,
  focusLevel: 7,
  productivityLevel: 7,
  stressLevel: 4,
  waterIntake: 2000,
  junkFood: false,
  socialInteraction: 5,
  workoutDone: false,
  exerciseDuration: 30,
  workoutType: "",
  pagesRead: 0,
  bookName: "",
  studyHours: 0,
  studyTopic: "",
  notes: "",
  wins: "",
  challenges: "",
};

export function entryToCheckInForm(entry: LogEntry): CheckInFormState {
  return {
    moodScore: entry.mood_score,
    sleepHours: entry.sleep_hours ?? DEFAULT_CHECK_IN_FORM.sleepHours,
    sleepQuality: entry.sleep_quality ?? DEFAULT_CHECK_IN_FORM.sleepQuality,
    energyLevel: entry.energy_level ?? DEFAULT_CHECK_IN_FORM.energyLevel,
    focusLevel: entry.focus_level ?? DEFAULT_CHECK_IN_FORM.focusLevel,
    productivityLevel: entry.productivity_level ?? DEFAULT_CHECK_IN_FORM.productivityLevel,
    stressLevel: entry.stress_level ?? DEFAULT_CHECK_IN_FORM.stressLevel,
    waterIntake: entry.water_intake ?? DEFAULT_CHECK_IN_FORM.waterIntake,
    junkFood: Boolean(entry.junk_food),
    socialInteraction: entry.social_interaction ?? DEFAULT_CHECK_IN_FORM.socialInteraction,
    workoutDone: Boolean(entry.workout_done),
    exerciseDuration: entry.exercise_duration ?? DEFAULT_CHECK_IN_FORM.exerciseDuration,
    workoutType: entry.workout_type || "",
    pagesRead: entry.pages_read ?? 0,
    bookName: entry.book_name || "",
    studyHours: entry.study_hours ?? 0,
    studyTopic: entry.study_topic || "",
    notes: entry.notes || "",
    wins: entry.wins || "",
    challenges: entry.challenges || "",
  };
}
