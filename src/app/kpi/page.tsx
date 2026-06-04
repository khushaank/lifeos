"use client";

import { PageShell } from "@/components/page-shell";
import { CeoKpiDashboard } from "@/components/ceo-kpi-dashboard";
import { useLifeStore } from "@/store/useLifeStore";
import { useSyncLifeData } from "@/hooks/use-sync-life-data";
import { KpiRowSkeleton } from "@/components/loading-skeletons";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function KpiPage() {
  const entries = useLifeStore((s) => s.entries);
  const tasks = useLifeStore((s) => s.tasks);
  const focusTimer = useLifeStore((s) => s.focusTimer);
  const isSyncing = useLifeStore((s) => s.isSyncing);

  useSyncLifeData();

  const loading = isSyncing && entries.length === 0;

  return (
    <PageShell maxWidth="7xl" mainClassName="space-y-6">
      <div className="flex justify-start">
        <div className="hidden">
          <div className="h-11 w-11 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Personal KPI</h1>
            <p className="text-sm text-muted-foreground">
              CEO-style executive view — domains, trends, week-over-week
            </p>
          </div>
        </div>
        <Link href="/experiments">
          <Button variant="outline" size="sm" className="cursor-pointer text-xs">
            90-day challenges
          </Button>
        </Link>
      </div>

      {loading ? <KpiRowSkeleton /> : <CeoKpiDashboard entries={entries} tasks={tasks} focusTimer={focusTimer} />}
    </PageShell>
  );
}
