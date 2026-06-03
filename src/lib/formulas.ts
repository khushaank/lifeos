export interface Habit {
  id: string;
  name: string;
  targetPerWeek: number;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1 to 10 or 1 to 8 (we support flexible scoring or converting to 8)
  mood_label?: string;
  sleepHours: number;
  sleep_quality?: number;
  waterIntakeMl: number;
  productivity: number; // 1 to 10
  focus_level?: number;
  stress_level?: number;
  energy_level?: number;
  exerciseMinutes: number;
  habitsCompleted: string[]; // Habit IDs
  notes?: string;
  wins?: string;
  challenges?: string;
  life_score?: number;
}

/**
 * Dynamic Life Score calculation. Maps multiple dimensional categories.
 * Max Output: 100 points.
 * 
 * Weights:
 * - Sleep quality: 15%
 * - Mood Score (1-8 scale): 20%
 * - Focus performance: 15%
 * - Productivity metrics: 20%
 * - Stress Inverse metrics: 15%
 * - Exercise compliance: 15%
 */
export function calculateLifeScore(params: {
  moodScore: number; // 1 to 8
  sleepQuality: number; // 1 to 10
  focusLevel: number; // 1 to 10
  productivityLevel: number; // 1 to 10
  stressLevel: number; // 1 to 10
  workoutDone: boolean;
}): number {
  const normMood = (params.moodScore / 8) * 100;
  const normSleep = (params.sleepQuality / 10) * 100;
  const normFocus = (params.focusLevel / 10) * 100;
  const normProductivity = (params.productivityLevel / 10) * 100;
  const normStress = ((11 - params.stressLevel) / 10) * 100; // inverted stress score
  const normWorkout = params.workoutDone ? 100 : 0;

  const weightedSum =
    normMood * 0.20 +
    normSleep * 0.15 +
    normFocus * 0.15 +
    normProductivity * 0.20 +
    normStress * 0.15 +
    normWorkout * 0.15;

  return Math.round(weightedSum * 10) / 10;
}

/**
 * Calculates the current streak of check-ins (consecutive days)
 */
export function calculateCheckInStreak(checkIns: { date: string }[]): { current: number; longest: number } {
  if (checkIns.length === 0) return { current: 0, longest: 0 };

  // Sort dates in descending order (newest first)
  const sortedDates = [...new Set(checkIns.map((c) => c.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateObjects = sortedDates.map(d => {
    const parsed = new Date(d);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  });

  if (dateObjects.length === 0) return { current: 0, longest: 0 };

  const mostRecent = dateObjects[0];
  const diffTime = today.getTime() - mostRecent.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const hasRecentCheckIn = diffDays <= 1;

  let lastDate: Date | null = null;
  for (let i = 0; i < dateObjects.length; i++) {
    const currentDate = dateObjects[i];

    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const diff = lastDate.getTime() - currentDate.getTime();
      const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    lastDate = currentDate;
  }

  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  currentStreak = hasRecentCheckIn ? tempStreak : 0;
  
  if (hasRecentCheckIn) {
    let activeStreak = 0;
    const expectedDate = new Date(dateObjects[0]);
    
    for (let i = 0; i < dateObjects.length; i++) {
      const diff = expectedDate.getTime() - dateObjects[i].getTime();
      const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        activeStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreak = activeStreak;
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak),
  };
}

/**
 * Calculates the current streak of a specific habit
 */
export function calculateHabitStreak(
  habitId: string,
  checkIns: { date: string; habitsCompleted: string[] }[]
): { current: number; longest: number } {
  const habitCheckIns = checkIns
    .filter((c) => c.habitsCompleted.includes(habitId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (habitCheckIns.length === 0) return { current: 0, longest: 0 };

  const dates = habitCheckIns.map(c => {
    const d = new Date(c.date);
    d.setHours(0,0,0,0);
    return d;
  });

  const today = new Date();
  today.setHours(0,0,0,0);

  const diffTime = today.getTime() - dates[0].getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isActive = diffDays <= 1;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (let i = 0; i < dates.length; i++) {
    const currentDate = dates[i];
    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const diff = lastDate.getTime() - currentDate.getTime();
      const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 1;
      }
    }
    lastDate = currentDate;
  }

  if (tempStreak > longestStreak) longestStreak = tempStreak;
  currentStreak = isActive ? tempStreak : 0;

  if (isActive) {
    let activeStreak = 0;
    const expectedDate = new Date(dates[0]);
    for (let i = 0; i < dates.length; i++) {
      const diff = expectedDate.getTime() - dates[i].getTime();
      const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        activeStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreak = activeStreak;
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak),
  };
}
