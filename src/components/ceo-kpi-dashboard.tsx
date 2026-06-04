"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { LogEntry, LifeTask } from "@/store/useLifeStore";
import type { FocusTimerClientState } from "@/lib/focus-timer";
import { buildCeoMetrics, STATUS_STYLES } from "@/lib/ceo-metrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ChevronRight,
  Briefcase,
} from "lucide-react";

type Props = {
  entries: LogEntry[];
  tasks: LifeTask[];
  focusTimer: FocusTimerClientState;
  compact?: boolean;
};

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
        <Minus className="h-3 w-3" /> —
      </span>
    );
  }
  const up = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-bold",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {delta}% WoW
    </span>
  );
}

export function CeoKpiDashboard({ entries, tasks, focusTimer, compact }: Props) {
  const metrics = useMemo(
    () => buildCeoMetrics(entries, tasks, focusTimer),
    [entries, tasks, focusTimer]
  );

  if (entries.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Log check-ins to unlock your executive KPI board.
        </CardContent>
      </Card>
    );
  }

  const maxTrend = Math.max(...metrics.lifeScoreTrend, 1);

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border shadow-sm",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white",
          "dark:from-slate-950 dark:via-slate-900 dark:to-black"
        )}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-400 to-transparent" />
        <div className="relative px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-300/90 mb-1">
                North star · Life score
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black tabular-nums">
                  {metrics.northStar}
                </span>
                <span className="text-lg text-slate-400">/ 100</span>
              </div>
              <DeltaBadge delta={metrics.northStarWow} />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center sm:text-right">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Check-ins</p>
                <p className="text-xl font-bold">{metrics.checkInRate7d}%</p>
                <p className="text-[10px] text-slate-500">7-day rate</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Study</p>
                <p className="text-xl font-bold">{metrics.studyHoursThisWeek.toFixed(1)}h</p>
                <DeltaBadge delta={metrics.studyHoursWow} />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Tasks done</p>
                <p className="text-xl font-bold">{metrics.tasksCompletedWeek}</p>
                <p className="text-[10px] text-slate-500">this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Life score · 7-day trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-24">
              {metrics.lifeScoreTrend.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full max-w-8 rounded-t bg-teal-500/90 dark:bg-teal-400 transition-all"
                    style={{ height: `${Math.max(8, (val / maxTrend) * 100)}%` }}
                    title={`${metrics.weekLabels[i]}: ${val}`}
                  />
                  <span className="text-[9px] text-muted-foreground">{metrics.weekLabels[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-bold mb-3 px-1 flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Domain health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.domains.map((domain) => {
            const style = STATUS_STYLES[domain.status];
            return (
              <Card key={domain.id} className="rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{domain.name}</CardTitle>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
                        style.text,
                        "bg-muted/50"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                      {style.label}
                    </span>
                  </div>
                  <CardDescription className="text-xs">{domain.headline}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-end justify-between mb-2">
                    <span className={cn("text-3xl font-black tabular-nums", style.text)}>
                      {domain.score}
                    </span>
                    <DeltaBadge delta={domain.wowDelta} />
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", style.bar)}
                      style={{ width: `${domain.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">{domain.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {!compact && (
        <Link
          href="/insights"
          className="flex items-center justify-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
        >
          Correlations & heatmap <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
