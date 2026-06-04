import type {
  LogEntry,
  DecisionEntry,
  MissedOpportunity,
  MovieEntry,
  LifeTask,
} from "@/store/useLifeStore";

export type ActivityItem = {
  id: string;
  type: string;
  label: string;
  detail?: string;
  href?: string;
};

export function getActivitiesForDate(
  date: string,
  entries: LogEntry[],
  decisions: DecisionEntry[],
  opportunities: MissedOpportunity[],
  movies: MovieEntry[],
  tasks: LifeTask[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  const entry = entries.find((e) => e.date === date);
  if (entry) {
    items.push({
      id: `checkin-${date}`,
      type: "Check-in",
      label: `Daily check-in · Life score ${entry.life_score}`,
      detail: `${entry.mood_label} · Sleep ${entry.sleep_hours ?? "—"}h · Prod ${entry.productivity_level ?? "—"}/10`,
      href: `/check-in?date=${date}`,
    });
  }

  for (const d of decisions.filter((x) => x.decision_date === date)) {
    items.push({
      id: `decision-${d.id}`,
      type: "Decision",
      label: d.title,
      detail: d.decision_made,
      href: "/journal",
    });
  }

  for (const o of opportunities.filter((x) => x.opportunity_date === date)) {
    items.push({
      id: `opp-${o.id}`,
      type: "Missed opportunity",
      label: o.title,
      detail: o.lesson_learned || o.why_missed,
      href: "/opportunities",
    });
  }

  for (const m of movies.filter((x) => x.watched_date === date)) {
    items.push({
      id: `movie-${m.id}`,
      type: "Movie",
      label: m.title,
      detail: `Rated ${m.rating}/10`,
      href: "/movies",
    });
  }

  for (const t of tasks.filter((x) => x.due_date === date)) {
    items.push({
      id: `task-${t.id}`,
      type: "Task",
      label: t.title,
      detail: `${t.status} · ${t.priority}`,
      href: "/planner",
    });
  }

  return items;
}

/** Combined activity weight per day for the master heatmap */
export function combinedActivityScore(
  date: string,
  entries: LogEntry[],
  decisions: DecisionEntry[],
  opportunities: MissedOpportunity[],
  movies: MovieEntry[],
  tasks: LifeTask[]
): number {
  let score = 0;
  if (entries.some((e) => e.date === date)) score += 4;
  score += decisions.filter((d) => d.decision_date === date).length * 2;
  score += opportunities.filter((o) => o.opportunity_date === date).length * 2;
  score += movies.filter((m) => m.watched_date === date).length;
  score += tasks.filter((t) => t.due_date === date && t.status !== "Done").length * 0.5;
  score += tasks.filter((t) => t.due_date === date && t.status === "Done").length;
  return score;
}

export function datesInMonth(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function formatDisplayDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
