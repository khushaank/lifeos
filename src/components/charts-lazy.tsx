"use client";

import dynamic from "next/dynamic";

function ChartSkeleton() {
  return (
    <div className="h-64 w-full rounded-2xl border border-border bg-muted/30 animate-pulse" />
  );
}

export const TrendChartsLazy = dynamic(
  () => import("@/components/trend-charts").then((m) => ({ default: m.TrendCharts })),
  { ssr: false, loading: ChartSkeleton }
);

export const KPIDashboardLazy = dynamic(
  () => import("@/components/kpi-dashboard").then((m) => ({ default: m.KPIDashboard })),
  { ssr: false, loading: () => <div className="h-32 rounded-2xl bg-muted/30 animate-pulse" /> }
);

export const CorrelationDashboardLazy = dynamic(
  () => import("@/components/correlation-dashboard").then((m) => ({ default: m.CorrelationDashboard })),
  { ssr: false, loading: ChartSkeleton }
);
