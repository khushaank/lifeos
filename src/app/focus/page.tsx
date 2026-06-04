"use client";

import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { AntiProcrastination } from "@/components/anti-procrastination";
import { Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FocusPage() {
  const [activeTab, setActiveTab] = useState<"pomodoro" | "procrastination">("pomodoro");

  return (
    <PageShell maxWidth="3xl" mainClassName="space-y-6">
      <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab("pomodoro")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                activeTab === "pomodoro"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              Pomodoro
            </button>
            <button
              onClick={() => setActiveTab("procrastination")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                activeTab === "procrastination"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Fix Procrastination
            </button>
      </div>

      {activeTab === "pomodoro" ? <PomodoroTimer /> : <AntiProcrastination />}
    </PageShell>
  );
}
