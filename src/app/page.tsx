"use client";

import { useState } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import { KPIDashboardLazy, TrendChartsLazy } from "@/components/charts-lazy";
import { useSyncLifeData } from "@/hooks/use-sync-life-data";
import { PageShell } from "@/components/page-shell";
import { GoalsPanel } from "@/components/goals-panel";
import { PersonalCoach } from "@/components/personal-coach";
import {
  DashboardHeroSkeleton,
  KpiRowSkeleton,
  CardListSkeleton,
} from "@/components/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle,
  RefreshCw,
  ChevronRight,
  Activity,
  BookOpen,
  Clock,
  Flame,
  ListTodo,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const entries = useLifeStore((state) => state.entries);
  const tasks = useLifeStore((state) => state.tasks);
  const updateTask = useLifeStore((state) => state.updateTask);
  const syncAll = useLifeStore((state) => state.syncAll);
  const isSyncing = useLifeStore((state) => state.isSyncing);

  useSyncLifeData();

  const recentEntries = entries.slice(0, 5);
  const upcomingTasks = tasks
    .filter((task) => task.status !== "Done")
    .sort((a, b) => `${a.due_date}${a.due_time || ""}`.localeCompare(`${b.due_date}${b.due_time || ""}`))
    .slice(0, 4);
  const todayStr = new Date().toISOString().split("T")[0];
  const loggedToday = entries.some((e) => e.date === todayStr);
  const initialLoad = isSyncing && entries.length === 0;

  // Selfie modal state
  const [selfieModal, setSelfieModal] = useState<string | null>(null);

  return (
    <PageShell mainClassName="space-y-6" className="pb-20">
      {/* Dashboard hero — light by default, cinematic in dark mode */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border shadow-lg",
          "border-slate-200 bg-gradient-to-br from-teal-50 via-white to-slate-100 text-slate-900",
          "dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white"
        )}
      >
        <div className="absolute inset-0 opacity-0 dark:opacity-40 mix-blend-overlay pointer-events-none">
          <img src="/images/dashboard_cover.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-b from-white/90 via-teal-50/40 to-slate-100/90",
            "dark:from-slate-950/85 dark:via-slate-900/50 dark:to-slate-950"
          )}
        />

        <div className="relative z-10 px-6 py-8 md:px-8 md:py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-sm",
                  "bg-teal-500/15 border-teal-500/30 text-teal-600",
                  "dark:bg-teal-500/25 dark:border-teal-500/35 dark:text-teal-400"
                )}
              >
                <Flame className="h-5 w-5 fill-current" />
              </div>
              <span
                className={cn(
                  "text-xs font-bold tracking-wider uppercase",
                  "text-teal-700 dark:text-teal-400"
                )}
              >
                LifeOS Workspace
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">LifeOS Dashboard</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/kpi">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "cursor-pointer backdrop-blur-sm text-xs font-bold h-9 hidden sm:inline-flex",
                  "border-slate-300 bg-white/80 text-slate-700 hover:bg-white",
                  "dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
                )}
              >
                <Briefcase className="h-3.5 w-3.5 mr-2" />
                KPI Board
              </Button>
            </Link>
            <Button
                onClick={() => syncAll({ force: true })}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className={cn(
                "cursor-pointer backdrop-blur-sm text-xs font-bold h-9",
                "border-slate-300 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900",
                "dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
              )}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Link href={loggedToday ? `/check-in?date=${todayStr}` : "/check-in"}>
              <Button className="bg-teal-500 hover:bg-teal-600 text-white font-bold cursor-pointer shadow-md shadow-teal-500/20 text-xs h-9 px-4">
                <PlusCircle className="mr-2 h-3.5 w-3.5" />
                {loggedToday ? "Update Today" : "Log Today"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {initialLoad && (
        <>
          <DashboardHeroSkeleton />
          <KpiRowSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CardListSkeleton rows={3} />
            </div>
            <CardListSkeleton rows={2} />
          </div>
        </>
      )}

      {!initialLoad && entries.length === 0 && (
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm dark:from-teal-950/40 dark:to-emerald-950/30 dark:border-teal-900/50">
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Flame className="h-8 w-8" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-bold text-teal-800 dark:text-teal-200">Welcome to LifeOS!</h2>
              <p className="text-sm text-teal-700 dark:text-teal-300/90 mt-1">
                Start by logging your first daily check-in or adding private tasks in Planner.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/check-in">
                <Button className="bg-teal-500 hover:bg-teal-600 text-white cursor-pointer">Start Check-in</Button>
              </Link>
              <Link href="/planner">
                <Button
                  variant="outline"
                  className="border-teal-300 text-teal-700 hover:bg-teal-50 cursor-pointer dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/50"
                >
                  Open Planner
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!initialLoad && entries.length > 0 && (
        <>
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 px-1">
              Performance Overview
            </h2>
            <KPIDashboardLazy entries={entries} />
          </div>
          <TrendChartsLazy entries={entries} />
          <PersonalCoach entries={entries} />
        </>
      )}

      {!initialLoad && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {entries.length > 0 && (
            <Card className="bg-card border-border shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Recent Check-ins</CardTitle>
                  <CardDescription className="text-xs">
                    Your last {Math.min(5, entries.length)} daily logs
                  </CardDescription>
                </div>
                <Link href="/check-in" className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center font-semibold">
                  Add New <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {recentEntries.map((e) => (
                    <div key={e.date} className="flex items-center justify-between py-3.5 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {new Date(e.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:bg-teal-950/50 dark:border-teal-800 dark:text-teal-400">
                            Score: {e.life_score}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400">
                            {e.mood_label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                          Sleep: {e.sleep_hours}h · Prod: {e.productivity_level}/10 ·{" "}
                          {e.workout_done ? "Worked out" : "No workout"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex gap-1.5">
                          {e.workout_done && (
                            <Activity className="h-4 w-4 text-emerald-500" />
                          )}
                          {e.workout_done && e.workout_selfie && (
                            <button
                              onClick={() => setSelfieModal(e.workout_selfie!)}
                              className="h-7 w-7 rounded-full overflow-hidden border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all shadow-sm"
                              title="View workout selfie"
                            >
                              <img src={e.workout_selfie} alt="Selfie" className="w-full h-full object-cover" />
                            </button>
                          )}
                          {e.pages_read && e.pages_read > 0 ? (
                            <BookOpen className="h-4 w-4 text-sky-500" />
                          ) : null}
                          {e.study_hours && e.study_hours > 0 ? (
                            <Clock className="h-4 w-4 text-violet-500" />
                          ) : null}
                        </div>
                        <Link href={`/check-in?date=${e.date}`}>
                          <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selfie Modal */}
          {selfieModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => setSelfieModal(null)}
            >
              <div className="relative max-w-md w-full mx-4" onClick={(ev) => ev.stopPropagation()}>
                <img
                  src={selfieModal}
                  alt="Workout selfie"
                  className="w-full rounded-2xl shadow-2xl border-4 border-white/20"
                />
                <button
                  onClick={() => setSelfieModal(null)}
                  className="absolute top-3 right-3 h-8 w-8 bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Upcoming Plan</CardTitle>
                <CardDescription className="text-xs">Open tasks from the Planner</CardDescription>
              </div>
              <Link href="/planner" className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center font-semibold">
                Planner <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm text-center">
                  <ListTodo className="h-7 w-7 mb-2 opacity-40" />
                  <p className="font-semibold text-xs">No active tasks</p>
                  <p className="text-[11px] mt-0.5">Add tasks in Planner to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {upcomingTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => updateTask(task.id, { status: "Done" })}
                      className="rounded-xl border border-border bg-muted/50 px-3.5 py-3 text-left hover:border-emerald-300 hover:bg-emerald-50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold truncate">{task.title}</p>
                        <span className="rounded-full bg-card px-2 py-0.5 text-[9px] font-bold text-muted-foreground border border-border">
                          {task.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {task.due_date} {task.due_time || ""}
                      </p>
                      <p className="mt-1.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                        Complete
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <GoalsPanel limit={5} />
        </div>
      </div>
      )}
    </PageShell>
  );
}
