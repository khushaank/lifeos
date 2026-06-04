"use client";

import { PageShell } from "@/components/page-shell";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { Timer } from "lucide-react";

export default function FocusPage() {
  return (
    <PageShell maxWidth="3xl">
      <div className="bg-card rounded-2xl px-4 py-5 sm:px-6 shadow-sm border border-border mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/50">
            <Timer className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Focus</h1>
            <p className="text-sm text-muted-foreground">
              Pomodoro and deep-work timers — 5, 15, 25, 45, or 90 minutes
            </p>
          </div>
        </div>
      </div>
      <PomodoroTimer />
    </PageShell>
  );
}
