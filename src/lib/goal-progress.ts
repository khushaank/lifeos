import type { LifeGoal, LogEntry, GoalMetric } from "@/store/useLifeStore";

export type { GoalMetric };

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const c = new Date(d);
    c.setDate(c.getDate() - i);
    out.push(c.toISOString().split("T")[0]);
  }
  return out;
}

function entriesInDates(entries: LogEntry[], dates: string[]) {
  const set = new Set(dates);
  return entries.filter((e) => set.has(e.date));
}

export function measureCurrentValue(metric: GoalMetric | undefined, entries: LogEntry[]): number {
  const weekDates = lastNDays(7);
  const weekEntries = entriesInDates(entries, weekDates);
  const monthDates = lastNDays(30);
  const monthEntries = entriesInDates(entries, monthDates);

  switch (metric) {
    case "study_hours_weekly":
      return weekEntries.reduce((s, e) => s + (e.study_hours || 0), 0);
    case "study_hours_daily": {
      const today = weekDates[0];
      const todayEntry = entries.find((e) => e.date === today);
      return todayEntry?.study_hours ?? 0;
    }
    case "sleep_hours_avg": {
      if (weekEntries.length === 0) return 0;
      return (
        weekEntries.reduce((s, e) => s + (e.sleep_hours || 0), 0) / weekEntries.length
      );
    }
    case "water_daily": {
      const today = weekDates[0];
      return entries.find((e) => e.date === today)?.water_intake ?? 0;
    }
    case "workouts_weekly":
      return weekEntries.filter((e) => e.workout_done).length;
    case "checkins_monthly":
      return monthEntries.length;
    case "pages_read_weekly":
      return weekEntries.reduce((s, e) => s + (e.pages_read || 0), 0);
    default:
      return 0;
  }
}

export function progressPercent(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function enrichGoalWithProgress(goal: LifeGoal, entries: LogEntry[]): LifeGoal {
  const metric = goal.metric ?? "custom";
  if (metric === "custom") {
    return goal;
  }
  const targetVal = goal.target_value ?? parseTargetFromLabel(goal.target);
  const current = measureCurrentValue(metric, entries);
  const progress = progressPercent(current, targetVal);
  return {
    ...goal,
    current_value: Math.round(current * 10) / 10,
    progress,
  };
}

export function enrichGoalsWithProgress(goals: LifeGoal[], entries: LogEntry[]): LifeGoal[] {
  return goals.map((g) => enrichGoalWithProgress(g, entries));
}

function parseTargetFromLabel(target: string): number {
  const m = target.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 1;
}

export const METRIC_OPTIONS: { value: GoalMetric; label: string; unit: string; defaultTarget: number }[] = [
  { value: "study_hours_weekly", label: "Study hours (per week)", unit: "hrs", defaultTarget: 14 },
  { value: "study_hours_daily", label: "Study hours (today)", unit: "hrs", defaultTarget: 2 },
  { value: "sleep_hours_avg", label: "Avg sleep (7-day)", unit: "hrs", defaultTarget: 8 },
  { value: "water_daily", label: "Water today", unit: "ml", defaultTarget: 3000 },
  { value: "workouts_weekly", label: "Workouts per week", unit: "days", defaultTarget: 5 },
  { value: "checkins_monthly", label: "Check-ins per month", unit: "days", defaultTarget: 25 },
  { value: "pages_read_weekly", label: "Pages read per week", unit: "pages", defaultTarget: 100 },
  { value: "custom", label: "Manual progress", unit: "", defaultTarget: 100 },
];

export const GOAL_COLORS = [
  "bg-teal-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];
