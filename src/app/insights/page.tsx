"use client";

import { useMemo } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import { CorrelationDashboardLazy } from "@/components/charts-lazy";
import { UnifiedActivityHeatmap } from "@/components/unified-activity-heatmap";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Sparkles, ShieldCheck, AlertTriangle, Zap, Info, type LucideIcon } from "lucide-react";
import { calculatePearson } from "@/lib/correlation";
import { cn } from "@/lib/utils";
import { useSyncLifeData } from "@/hooks/use-sync-life-data";
import { PersonalCoach } from "@/components/personal-coach";
import { HeatmapSkeleton, CoachSkeleton } from "@/components/loading-skeletons";

interface InsightCard {
  title: string;
  desc: string;
  type: "positive" | "caution" | "burnout" | "neutral";
  icon: LucideIcon;
}

export default function InsightsPage() {
  const entries = useLifeStore((state) => state.entries);
  const tasks = useLifeStore((state) => state.tasks);
  const decisions = useLifeStore((state) => state.decisions);
  const opportunities = useLifeStore((state) => state.opportunities);
  const movies = useLifeStore((state) => state.movies);
  const isSyncing = useLifeStore((state) => state.isSyncing);

  useSyncLifeData();

  const loadingHeatmap =
    isSyncing &&
    entries.length === 0 &&
    decisions.length === 0 &&
    opportunities.length === 0 &&
    movies.length === 0;

  const insights = useMemo(() => {
    const list: InsightCard[] = [];

    if (entries.length < 5) {
      return [
        {
          title: "Not Enough Data Yet",
          desc: "Log at least 5 daily check-ins to unlock pattern insights.",
          type: "neutral" as const,
          icon: Info,
        },
      ];
    }

    const last30 = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    const count = last30.length;
    const avgSleep = last30.reduce((s, c) => s + (c.sleep_hours || 0), 0) / count;
    const avgStress = last30.reduce((s, c) => s + (c.stress_level || 0), 0) / count;
    const avgMood = last30.reduce((s, c) => s + (c.mood_score || 0), 0) / count;
    const avgProductivity = last30.reduce((s, c) => s + (c.productivity_level || 0), 0) / count;
    const workoutCount = last30.filter((c) => c.workout_done).length;
    const workoutRatio = workoutCount / count;

    const sleepProdR = calculatePearson(
      last30.map((e) => e.sleep_hours || 0),
      last30.map((e) => e.productivity_level || 0)
    );
    const stressMoodR = calculatePearson(
      last30.map((e) => e.stress_level || 0),
      last30.map((e) => e.mood_score || 0)
    );

    if (sleepProdR > 0.45) {
      list.push({
        title: "Sleep Fuels Your Output",
        desc: `Strong link (r=${sleepProdR.toFixed(2)}) between sleep and productivity.`,
        type: "positive",
        icon: Zap,
      });
    }
    if (avgStress > 7 && avgSleep < 6.5) {
      list.push({
        title: "Burnout Risk Detected",
        desc: `Stress ${avgStress.toFixed(1)}/10 with low sleep (${avgSleep.toFixed(1)}h).`,
        type: "burnout",
        icon: AlertTriangle,
      });
    }
    if (workoutRatio >= 0.5) {
      list.push({
        title: "Strong Exercise Consistency",
        desc: `Worked out ${workoutCount} of ${count} days.`,
        type: "positive",
        icon: ShieldCheck,
      });
    }
    if (stressMoodR < -0.45) {
      list.push({
        title: "Stress Suppresses Mood",
        desc: `Mood sensitive to stress (r=${stressMoodR.toFixed(2)}).`,
        type: "caution",
        icon: TrendingUp,
      });
    }
    if (avgMood >= 6 && avgProductivity >= 7) {
      list.push({
        title: "High Performance Zone",
        desc: `Mood ${avgMood.toFixed(1)}/8 · Productivity ${avgProductivity.toFixed(1)}/10.`,
        type: "positive",
        icon: Sparkles,
      });
    }
    if (list.length === 0) {
      list.push({
        title: "Baseline Stable",
        desc: "Keep checking in daily to uncover more patterns.",
        type: "neutral",
        icon: Sparkles,
      });
    }
    return list;
  }, [entries]);

  const insightStyles: Record<InsightCard["type"], { bg: string; border: string; badge: string; badgeText: string }> = {
    positive: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-100 dark:bg-emerald-900/50",
      badgeText: "text-emerald-700 dark:text-emerald-300",
    },
    caution: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      badge: "bg-amber-100 dark:bg-amber-900/50",
      badgeText: "text-amber-700 dark:text-amber-300",
    },
    burnout: {
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-200 dark:border-rose-800",
      badge: "bg-rose-100 dark:bg-rose-900/50",
      badgeText: "text-rose-700 dark:text-rose-300",
    },
    neutral: {
      bg: "bg-muted/40",
      border: "border-border",
      badge: "bg-muted",
      badgeText: "text-muted-foreground",
    },
  };

  const badgeLabels: Record<InsightCard["type"], string> = {
    positive: "Positive",
    caution: "Caution",
    burnout: "High Risk",
    neutral: "Info",
  };

  return (
    <PageShell maxWidth="7xl" mainClassName="space-y-6">
      <div className="bg-card rounded-2xl px-4 py-5 sm:px-6 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-violet-50 dark:bg-violet-950/40 ring-1 ring-violet-200 dark:ring-violet-800 flex items-center justify-center">
            <Brain className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Insights</h1>
            <p className="text-sm text-muted-foreground">Heatmap, patterns, and correlations</p>
          </div>
        </div>
      </div>

      {loadingHeatmap ? (
        <HeatmapSkeleton />
      ) : (
        <UnifiedActivityHeatmap
          entries={entries}
          decisions={decisions}
          opportunities={opportunities}
          movies={movies}
          tasks={tasks}
        />
      )}

      {loadingHeatmap ? (
        <CoachSkeleton />
      ) : (
        entries.length > 0 && <PersonalCoach entries={entries} />
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold px-1 flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" /> Analytical feed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            const style = insightStyles[insight.type];
            return (
              <Card key={idx} className={cn(style.bg, "border", style.border, "rounded-2xl shadow-sm")}>
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm font-bold leading-tight flex-1">{insight.title}</CardTitle>
                    <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", style.badge, style.badgeText)}>
                      {badgeLabels[insight.type]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <CorrelationDashboardLazy entries={entries} />
    </PageShell>
  );
}
