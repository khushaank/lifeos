"use client";

import { useEffect } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import { KPIDashboard } from "@/components/kpi-dashboard";
import { TrendCharts } from "@/components/trend-charts";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calendar, RefreshCw, ChevronRight, Activity, BookOpen, Clock, Flame, ListTodo } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const entries = useLifeStore((state) => state.entries);
  const tasks = useLifeStore((state) => state.tasks);
  const goals = useLifeStore((state) => state.goals);
  const updateTask = useLifeStore((state) => state.updateTask);
  const fetchEntries = useLifeStore((state) => state.fetchEntries);
  const isSyncing = useLifeStore((state) => state.isSyncing);
  const isSidebarCollapsed = useLifeStore((state) => state.isSidebarCollapsed);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const recentEntries = entries.slice(0, 5);
  const upcomingTasks = tasks
    .filter((task) => task.status !== "Done")
    .sort((a, b) => `${a.due_date}${a.due_time || ""}`.localeCompare(`${b.due_date}${b.due_time || ""}`))
    .slice(0, 4);
  const todayStr = new Date().toISOString().split("T")[0];
  const loggedToday = entries.some((e) => e.date === todayStr);

  return (
    <div
      className={cn(
        "min-h-screen bg-slate-50 font-sans pb-20 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
      )}
    >
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
        {/* Unified Dashboard Header Cover */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-950 text-white shadow-lg">
          {/* Background image overlay */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
            <img src="/images/dashboard_cover.png" alt="Dashboard cover" className="w-full h-full object-cover" />
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/40 to-slate-950" />

          {/* Content */}
          <div className="relative z-10 px-6 py-8 md:px-8 md:py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/25 border border-teal-500/35 text-teal-400 backdrop-blur-sm">
                  <Flame className="h-5 w-5 fill-current" />
                </div>
                <span className="text-xs font-bold text-teal-400 tracking-wider uppercase">LifeOS Workspace</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">LifeOS Dashboard</h1>
              <p className="text-slate-300 text-xs font-medium">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => fetchEntries()}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer backdrop-blur-sm text-xs font-bold h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <Link href="/check-in">
                <Button className="bg-teal-500 hover:bg-teal-600 text-white font-bold cursor-pointer shadow-md shadow-teal-500/20 text-xs h-9 px-4">
                  <PlusCircle className="mr-2 h-3.5 w-3.5" />
                  {loggedToday ? "Update Today" : "Log Today"}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Welcome Banner if no entries */}
        {entries.length === 0 && (
          <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm">
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
                <Flame className="h-8 w-8" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-lg font-bold text-teal-800">Welcome to LifeOS! 👋</h2>
                <p className="text-sm text-teal-700 mt-1">
                  Start by logging your first daily check-in or adding private tasks in Planner.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/check-in">
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white cursor-pointer">
                    Start Check-in
                  </Button>
                </Link>
                <Link href="/planner">
                  <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50 cursor-pointer">
                    Open Planner
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Section */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-700 px-1">Performance Overview</h2>
            <KPIDashboard entries={entries} />
          </div>
        )}

        {/* Trend Charts */}
        {entries.length > 0 && <TrendCharts entries={entries} />}

        {/* Restructured Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content Column (col-span-2) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Recent Entries */}
            {entries.length > 0 && (
              <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">Recent Check-ins</CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Your last {Math.min(5, entries.length)} daily logs
                    </CardDescription>
                  </div>
                  <Link href="/check-in" className="text-xs text-teal-600 hover:text-teal-700 flex items-center font-semibold">
                    Add New <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-50">
                    {recentEntries.map((e) => (
                      <div key={e.date} className="flex items-center justify-between py-3.5 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-800">
                              {new Date(e.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-600">
                              Score: {e.life_score}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                              {e.mood_label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">
                            Sleep: {e.sleep_hours}h · Prod: {e.productivity_level}/10 ·{" "}
                            {e.workout_done ? "Worked out" : "No workout"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <div className="flex gap-1.5">
                            {e.workout_done && (
                              <span title="Workout Done">
                                <Activity className="h-4 w-4 text-emerald-500" />
                              </span>
                            )}
                            {e.pages_read && e.pages_read > 0 ? (
                              <span title={`Read ${e.pages_read} pages`}>
                                <BookOpen className="h-4 w-4 text-sky-500" />
                              </span>
                            ) : null}
                            {e.study_hours && e.study_hours > 0 ? (
                              <span title={`Studied ${e.study_hours} hrs`}>
                                <Clock className="h-4 w-4 text-violet-500" />
                              </span>
                            ) : null}
                          </div>
                          <Link href={`/check-in?date=${e.date}`}>
                            <button className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
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

            {/* Upcoming Plan Card */}
            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Upcoming Plan</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">Open tasks from the Planner</CardDescription>
                </div>
                <Link href="/planner" className="text-xs text-teal-600 hover:text-teal-700 flex items-center font-semibold">
                  Planner <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-sm text-center">
                    <ListTodo className="h-7 w-7 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-xs">No active tasks</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add tasks in Planner to see them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {upcomingTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => updateTask(task.id, { status: "Done" })}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-left hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-100">{task.priority}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {task.due_date} {task.due_time || ""}
                        </p>
                        <p className="mt-1.5 text-[9px] font-black text-emerald-600 tracking-wider uppercase">Complete</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column (col-span-1) */}
          <div className="space-y-5">
            {/* Goals Panel */}
            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-800">Daily Targets</CardTitle>
                <CardDescription className="text-slate-500 text-xs">Performance goals summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">{goal.title}</span>
                      <span className="text-slate-500 font-bold">{goal.target}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`${goal.color} h-1.5 rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-3 mt-1">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Track daily progress against your personal benchmarks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
