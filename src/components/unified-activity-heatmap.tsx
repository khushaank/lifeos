"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LogEntry, DecisionEntry, MissedOpportunity, MovieEntry, LifeTask } from "@/store/useLifeStore";
import { buildDateRange, groupWeeks, scoresToLevels } from "@/lib/heatmap";
import { getActivitiesForDate, datesInMonth, formatDisplayDate } from "@/lib/day-activities";
import { megaLifeScore } from "@/lib/mega-score";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const LEVEL_CLASS = [
  "bg-muted/50 dark:bg-muted/20",
  "bg-teal-200/90 dark:bg-teal-900/70",
  "bg-teal-400/90 dark:bg-teal-700/80",
  "bg-teal-500 dark:bg-teal-600",
  "bg-teal-600 dark:bg-teal-500 ring-1 ring-teal-400/50",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Props = {
  entries: LogEntry[];
  decisions: DecisionEntry[];
  opportunities: MissedOpportunity[];
  movies: MovieEntry[];
  tasks: LifeTask[];
};

function todayMonth() {
  return new Date().toISOString().slice(0, 7);
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

export function UnifiedActivityHeatmap({ entries, decisions, opportunities, movies, tasks }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(todayMonth());

  const allDays = useMemo(() => {
    const dates = buildDateRange(52);
    const valueByDate = new Map<string, number>();
    for (const date of dates) {
      valueByDate.set(
        date,
        megaLifeScore(date, entries, decisions, opportunities, movies, tasks)
      );
    }
    return scoresToLevels(dates, valueByDate);
  }, [entries, decisions, opportunities, movies, tasks]);

  const avgMegaScore = useMemo(() => {
    const active = allDays.filter((d) => d.value > 0);
    if (active.length === 0) return 0;
    return Math.round(active.reduce((s, d) => s + d.value, 0) / active.length);
  }, [allDays]);

  const weeks = useMemo(() => groupWeeks(allDays), [allDays]);

  const monthDays = useMemo(() => {
    const { start, end } = datesInMonth(viewMonth);
    return allDays.filter((d) => d.date >= start && d.date <= end);
  }, [allDays, viewMonth]);

  const monthActivities = useMemo(() => {
    const byDate = new Map<string, ReturnType<typeof getActivitiesForDate>>();
    for (const day of monthDays) {
      if (day.value > 0) {
        byDate.set(
          day.date,
          getActivitiesForDate(day.date, entries, decisions, opportunities, movies, tasks)
        );
      }
    }
    return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthDays, entries, decisions, opportunities, movies, tasks]);

  const selectedActivities = selectedDate
    ? getActivitiesForDate(selectedDate, entries, decisions, opportunities, movies, tasks)
    : [];

  const activeDays = allDays.filter((d) => d.value > 0).length;

  if (entries.length === 0 && decisions.length === 0 && opportunities.length === 0 && movies.length === 0) {
    return (
      <Card className="border-border rounded-2xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Log activity to see your unified heatmap.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold">Mega life heatmap</CardTitle>
            <CardDescription className="text-xs mt-1">
              Overall 0–100 score per day (check-ins, life score, journal, tasks, and more). Click a day.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Month</label>
            <input
              type="month"
              value={viewMonth}
              onChange={(e) => setViewMonth(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                setViewMonth(todayMonth());
                setSelectedDate(todayDate());
              }}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {activeDays} active days · avg score {avgMegaScore}/100 · darker = higher overall day
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex gap-1 min-w-max">
            <div className="flex flex-col gap-[3px] pt-5 pr-1 text-[9px] text-muted-foreground">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span key={i} className="h-3 sm:h-3.5 leading-3 flex items-center">
                  {d}
                </span>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-[3px] mb-1 h-4">
                {weeks.map((week, wi) => {
                  const first = week[0];
                  const month = first ? new Date(`${first.date}T12:00:00`).getMonth() : 0;
                  const showLabel =
                    wi === 0 ||
                    (first && new Date(`${first.date}T12:00:00`).getDate() <= 7);
                  return (
                    <div key={wi} className="w-3 sm:w-3.5 text-[9px] text-muted-foreground text-center">
                      {showLabel ? MONTHS[month] : ""}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day) => {
                      const inMonth = day.date.startsWith(viewMonth);
                      const isSelected = selectedDate === day.date;
                      return (
                        <button
                          key={day.date}
                          type="button"
                          title={`${day.date}: overall score ${day.value}/100`}
                          onClick={() => setSelectedDate(day.date)}
                          className={cn(
                            "h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-[2px] cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1",
                            LEVEL_CLASS[day.level],
                            !inMonth && "opacity-35",
                            isSelected && "ring-2 ring-teal-500 ring-offset-1 scale-110"
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            {LEVEL_CLASS.map((cls, i) => (
              <div key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", cls)} />
            ))}
            <span>More</span>
          </div>
        </div>

        {selectedDate && (
          <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold">{formatDisplayDate(selectedDate)}</h3>
                <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold mt-0.5">
                  Overall score:{" "}
                  {megaLifeScore(
                    selectedDate,
                    entries,
                    decisions,
                    opportunities,
                    movies,
                    tasks
                  )}
                  /100
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear
              </button>
            </div>
            {selectedActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logged activity on this day.</p>
            ) : (
              <ul className="space-y-2">
                {selectedActivities.map((a) => (
                  <li key={a.id}>
                    {a.href ? (
                      <Link
                        href={a.href}
                        className="flex items-center justify-between gap-2 rounded-lg bg-card/80 border border-border px-3 py-2 hover:border-teal-300 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400">
                            {a.type}
                          </p>
                          <p className="text-sm font-medium truncate">{a.label}</p>
                          {a.detail && (
                            <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    ) : (
                      <div className="rounded-lg bg-card/80 border border-border px-3 py-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">{a.type}</p>
                        <p className="text-sm font-medium">{a.label}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold mb-3">
            {new Date(`${viewMonth}-01T12:00:00`).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
            <span className="text-muted-foreground font-normal text-xs ml-2">
              ({monthActivities.length} days with activity)
            </span>
          </h3>
          {monthActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity logged this month.</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {monthActivities.map(([date, acts]) => (
                <div key={date}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "text-xs font-bold mb-1.5 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400",
                      selectedDate === date && "text-teal-600 dark:text-teal-400"
                    )}
                  >
                    {formatDisplayDate(date)}
                  </button>
                  <ul className="space-y-1.5 pl-2 border-l-2 border-border">
                    {acts.map((a) => (
                      <li key={a.id} className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{a.type}:</span> {a.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
