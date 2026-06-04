import type { ActiveExperiment } from "@/store/useLifeStore";

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function experimentProgress(exp: ActiveExperiment) {
  const today = todayString();
  const totalDays = daysBetween(exp.started_at, exp.ends_at) + 1;
  const elapsed = Math.min(totalDays, Math.max(0, daysBetween(exp.started_at, today) + 1));
  const doneCount = Object.values(exp.responses).filter((v) => v === true).length;
  const missedCount = Object.values(exp.responses).filter((v) => v === false).length;
  const adherence =
    doneCount + missedCount > 0
      ? Math.round((doneCount / (doneCount + missedCount)) * 100)
      : 0;
  const daysLeft = Math.max(0, daysBetween(today, exp.ends_at));
  const isExpired = today > exp.ends_at;
  const answeredToday = exp.responses[today] !== undefined;

  return {
    totalDays,
    elapsed,
    doneCount,
    missedCount,
    adherence,
    daysLeft,
    isExpired,
    answeredToday,
    pctTime: Math.round((elapsed / totalDays) * 100),
  };
}

export function pruneExpired(experiments: ActiveExperiment[]): ActiveExperiment[] {
  const today = todayString();
  return experiments.filter((e) => e.ends_at >= today);
}
