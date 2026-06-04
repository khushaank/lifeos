import type {
  LogEntry,
  DecisionEntry,
  MissedOpportunity,
  MovieEntry,
  LifeTask,
} from "@/store/useLifeStore";
import { combinedActivityScore } from "@/lib/day-activities";

/**
 * Single 0–100 "mega" score per day: check-ins, life score, and all logged activity.
 */
export function megaLifeScore(
  date: string,
  entries: LogEntry[],
  decisions: DecisionEntry[],
  opportunities: MissedOpportunity[],
  movies: MovieEntry[],
  tasks: LifeTask[]
): number {
  const activity = combinedActivityScore(
    date,
    entries,
    decisions,
    opportunities,
    movies,
    tasks
  );
  const entry = entries.find((e) => e.date === date);

  const activityPart = Math.min(45, activity * 6);
  const lifePart = entry ? Math.min(55, (entry.life_score / 100) * 55) : 0;

  if (!entry && activity === 0) return 0;
  return Math.round(Math.min(100, activityPart + lifePart));
}
