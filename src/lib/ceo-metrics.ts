import type { LogEntry, LifeTask } from "@/store/useLifeStore";
import type { FocusTimerClientState } from "@/lib/focus-timer";

export type MetricStatus = "excellent" | "good" | "watch" | "critical";

export type CeoDomain = {
  id: string;
  name: string;
  score: number;
  status: MetricStatus;
  headline: string;
  detail: string;
  wowDelta: number | null;
  unit: string;
};

export type CeoExecutiveSummary = {
  northStar: number;
  northStarWow: number;
  checkInRate7d: number;
  domains: CeoDomain[];
  weekLabels: string[];
  lifeScoreTrend: number[];
  studyHoursThisWeek: number;
  studyHoursWow: number;
  tasksCompletedWeek: number;
  focusSessionsWeek: number;
};

function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function statusFromScore(score: number): MetricStatus {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 45) return "watch";
  return "critical";
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function wow(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

export function buildCeoMetrics(
  entries: LogEntry[],
  tasks: LifeTask[],
  focusTimer: FocusTimerClientState
): CeoExecutiveSummary {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = lastNDays(7);
  const prev7 = lastNDays(14).slice(7);

  const inDates = (dates: string[]) => {
    const set = new Set(dates);
    return sorted.filter((e) => set.has(e.date));
  };

  const week = inDates(last7);
  const prevWeek = inDates(prev7);

  const lifeWeek = avg(week.map((e) => e.life_score));
  const lifePrev = avg(prevWeek.map((e) => e.life_score));
  const northStarWow = wow(lifeWeek, lifePrev) ?? 0;

  const checkInRate7d = Math.round((week.length / 7) * 100);

  const moodScore = Math.round((avg(week.map((e) => e.mood_score)) / 8) * 100) || 0;
  const sleepScore = Math.min(
    100,
    Math.round((avg(week.map((e) => e.sleep_hours || 0)) / 8) * 100)
  );
  const prodScore = Math.round((avg(week.map((e) => e.productivity_level || 0)) / 10) * 100);
  const studyWeek = week.reduce((s, e) => s + (e.study_hours || 0), 0);
  const studyPrev = prevWeek.reduce((s, e) => s + (e.study_hours || 0), 0);
  const studyWow = wow(studyWeek, studyPrev) ?? 0;
  const workoutRate = week.length
    ? Math.round((week.filter((e) => e.workout_done).length / week.length) * 100)
    : 0;

  const tasksDoneWeek = tasks.filter(
    (t) => t.status === "Done" && last7.includes(t.due_date)
  ).length;

  const focusSessionsWeek =
    focusTimer.sessionsCompletedDate &&
    last7.includes(focusTimer.sessionsCompletedDate)
      ? focusTimer.sessionsCompletedCount
      : week.length > 0
        ? Math.min(focusTimer.sessionsCompletedCount, 14)
        : 0;

  const domains: CeoDomain[] = [
    {
      id: "vitality",
      name: "Vitality",
      score: Math.round((moodScore + sleepScore) / 2),
      status: statusFromScore(Math.round((moodScore + sleepScore) / 2)),
      headline: `Mood & recovery`,
      detail: `Mood ${avg(week.map((e) => e.mood_score)).toFixed(1)}/8 · Sleep ${avg(week.map((e) => e.sleep_hours || 0)).toFixed(1)}h`,
      wowDelta: wow(avg(week.map((e) => e.mood_score)), avg(prevWeek.map((e) => e.mood_score))),
      unit: "% health",
    },
    {
      id: "execution",
      name: "Execution",
      score: prodScore,
      status: statusFromScore(prodScore),
      headline: "Productivity engine",
      detail: `${avg(week.map((e) => e.productivity_level || 0)).toFixed(1)}/10 avg · ${tasksDoneWeek} tasks closed`,
      wowDelta: wow(
        avg(week.map((e) => e.productivity_level || 0)),
        avg(prevWeek.map((e) => e.productivity_level || 0))
      ),
      unit: "% output",
    },
    {
      id: "learning",
      name: "Learning",
      score: Math.min(100, Math.round((studyWeek / 14) * 100)),
      status: statusFromScore(Math.min(100, Math.round((studyWeek / 14) * 100))),
      headline: "Study capital",
      detail: `${studyWeek.toFixed(1)}h this week`,
      wowDelta: studyWow,
      unit: "% of 14h target",
    },
    {
      id: "fitness",
      name: "Fitness",
      score: workoutRate,
      status: statusFromScore(workoutRate),
      headline: "Movement consistency",
      detail: `${week.filter((e) => e.workout_done).length}/${week.length || 1} workout days`,
      wowDelta: wow(
        week.filter((e) => e.workout_done).length,
        prevWeek.filter((e) => e.workout_done).length
      ),
      unit: "% adherence",
    },
    {
      id: "discipline",
      name: "Discipline",
      score: checkInRate7d,
      status: statusFromScore(checkInRate7d),
      headline: "Data discipline",
      detail: `${week.length}/7 check-ins logged`,
      wowDelta: wow(week.length, prevWeek.length),
      unit: "% logging",
    },
    {
      id: "focus",
      name: "Deep Focus",
      score: Math.min(100, focusSessionsWeek * 12),
      status: statusFromScore(Math.min(100, focusSessionsWeek * 12)),
      headline: "Focus sessions",
      detail: `${focusSessionsWeek} pomodoro blocks this week`,
      wowDelta: null,
      unit: "% capacity",
    },
  ];

  const weekLabels: string[] = [];
  const lifeScoreTrend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    weekLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    const entry = sorted.find((e) => e.date === key);
    lifeScoreTrend.push(entry?.life_score ?? 0);
  }

  return {
    northStar: Math.round(lifeWeek) || 0,
    northStarWow,
    checkInRate7d,
    domains,
    weekLabels,
    lifeScoreTrend,
    studyHoursThisWeek: studyWeek,
    studyHoursWow: studyWow,
    tasksCompletedWeek: tasksDoneWeek,
    focusSessionsWeek,
  };
}

export const STATUS_STYLES: Record<
  MetricStatus,
  { label: string; dot: string; bar: string; text: string }
> = {
  excellent: {
    label: "On track",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  good: {
    label: "Healthy",
    dot: "bg-teal-500",
    bar: "bg-teal-500",
    text: "text-teal-700 dark:text-teal-400",
  },
  watch: {
    label: "Watch",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  critical: {
    label: "At risk",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
  },
};
