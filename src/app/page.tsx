"use client";

import { useEffect } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import { KPIDashboard } from "@/components/kpi-dashboard";
import { TrendCharts } from "@/components/trend-charts";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calendar, RefreshCw, ChevronRight, Activity, BookOpen, Clock, Flame } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const entries = useLifeStore((state) => state.entries);
  const fetchEntries = useLifeStore((state) => state.fetchEntries);
  const isSyncing = useLifeStore((state) => state.isSyncing);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const recentEntries = entries.slice(0, 5);
  const todayStr = new Date().toISOString().split("T")[0];
  const loggedToday = entries.some((e) => e.date === todayStr);

  return (
    <div className="min-h-screen bg-slate-50 font-sans md:pl-64 pb-20">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
              <Flame className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">LifeOS Dashboard</h1>
              <p className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchEntries()}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Link href="/check-in">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold cursor-pointer shadow-md shadow-teal-500/20">
                <PlusCircle className="mr-2 h-4 w-4" />
                {loggedToday ? "Update Today" : "Log Today"}
              </Button>
            </Link>
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
                  Start by logging your first daily check-in, or generate 30 days of demo data in Settings to explore your analytics dashboard.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/check-in">
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white cursor-pointer">
                    Start Check-in
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50 cursor-pointer">
                    Generate Demo
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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Entries */}
          <Card className="bg-white border-slate-100 shadow-sm lg:col-span-2 rounded-2xl">
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
              {recentEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm">
                  <Calendar className="h-8 w-8 text-slate-300 mb-3" />
                  <p className="font-medium">No entries yet</p>
                  <p className="text-xs text-slate-400 mt-1">Log your first check-in to see entries here.</p>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>

          {/* Goals Panel */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-800">Daily Targets</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Performance goals summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Sleep Duration", target: "8.0 hrs", color: "bg-sky-500", width: "93%" },
                { label: "Water Intake", target: "3,000 ml", color: "bg-teal-500", width: "66%" },
                { label: "Weekly Workouts", target: "4 / 5 days", color: "bg-emerald-500", width: "80%" },
                { label: "Study Goal", target: "2 hrs / day", color: "bg-violet-500", width: "55%" },
              ].map((goal) => (
                <div key={goal.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">{goal.label}</span>
                    <span className="text-slate-500">{goal.target}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`${goal.color} h-1.5 rounded-full transition-all duration-700`}
                      style={{ width: goal.width }}
                    />
                  </div>
                </div>
              ))}

              <div className="border-t border-slate-100 pt-3 mt-1">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Customize targets in the{" "}
                  <Link href="/settings" className="text-teal-600 font-medium hover:underline">
                    Settings
                  </Link>{" "}
                  page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
