"use client";

import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { useSyncLifeData } from "@/hooks/use-sync-life-data";
import { useLifeStore } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Car, Clipboard, Dumbbell, Filter, Share2, X } from "lucide-react";
import Link from "next/link";

type WorkoutFilter = "all" | "workout" | "rest";
type CommuteFilter = "all" | "commute" | "no-commute";

export default function WorkoutPage() {
  const entries = useLifeStore((state) => state.entries);
  const [workoutFilter, setWorkoutFilter] = useState<WorkoutFilter>("all");
  const [commuteFilter, setCommuteFilter] = useState<CommuteFilter>("all");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [selfieModal, setSelfieModal] = useState<string | null>(null);

  useSyncLifeData();

  const workoutDays = entries.filter((entry) => entry.workout_done).length;
  const commuteDays = entries.filter((entry) => entry.commute_day).length;
  const totalWorkoutMinutes = entries.reduce((sum, entry) => sum + (entry.exercise_duration || 0), 0);
  const filteredEntries = entries.filter((entry) => {
    const workoutMatch =
      workoutFilter === "all" ||
      (workoutFilter === "workout" && entry.workout_done) ||
      (workoutFilter === "rest" && !entry.workout_done);
    const commuteMatch =
      commuteFilter === "all" ||
      (commuteFilter === "commute" && entry.commute_day) ||
      (commuteFilter === "no-commute" && !entry.commute_day);
    return workoutMatch && commuteMatch;
  });

  const shareText = [
    "LifeOS workout progress",
    `${entries.length} check-ins`,
    `${workoutDays} workout days`,
    `${totalWorkoutMinutes} workout minutes`,
    `${commuteDays} commute days`,
    "",
    ...filteredEntries.map((entry) => {
      const date = new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${date}: ${entry.workout_done ? `${entry.exercise_duration || 0} min ${entry.workout_type || "workout"}` : "no workout"}, ${entry.commute_day ? "commute" : "no commute"}, score ${entry.life_score}`;
    }),
  ].join("\n");

  const shareProgress = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "LifeOS workout progress", text: shareText });
        setShareMessage("Shared workout progress.");
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareMessage("Copied workout progress.");
      }
      setShareMenuOpen(false);
    } catch {
      setShareMessage("Sharing was cancelled.");
    }
  };

  return (
    <PageShell mainClassName="space-y-6">
      <div className="flex justify-start">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Workout Timeline</h1>
              <p className="text-sm text-muted-foreground">Workout pressure, commute days, and full check-in history</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button variant="outline" className="h-10 cursor-pointer">
                Dashboard
              </Button>
            </Link>
            <div className="relative">
              <Button type="button" onClick={() => setShareMenuOpen((open) => !open)} className="h-10 cursor-pointer bg-teal-500 text-white hover:bg-teal-600">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              {shareMenuOpen && (
                <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-border bg-card p-2 shadow-xl">
                  <button
                    type="button"
                    onClick={shareProgress}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-muted cursor-pointer"
                  >
                    <Clipboard className="h-3.5 w-3.5 text-sky-500" />
                    Share or copy timeline
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {[
          { label: "Check-ins", value: entries.length, className: "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-900/50" },
          { label: "Workouts", value: workoutDays, className: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50" },
          { label: "Minutes", value: totalWorkoutMinutes, className: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50" },
          { label: "Commutes", value: commuteDays, className: "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/50" },
        ].map((stat) => (
          <div key={stat.label} className={cn("rounded-xl border px-4 py-3 shadow-sm", stat.className)}>
            <p className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="mt-1 text-2xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-teal-500" />
            Filters
          </CardTitle>
          <CardDescription className="text-xs">Narrow the full timeline by workout and commute status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All workout" },
            { value: "workout", label: "Worked out" },
            { value: "rest", label: "No workout" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setWorkoutFilter(item.value as WorkoutFilter)}
              className={cn(
                "h-9 rounded-lg border px-3 text-xs font-semibold cursor-pointer transition-colors",
                workoutFilter === item.value
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
          {[
            { value: "all", label: "All commute" },
            { value: "commute", label: "Commute" },
            { value: "no-commute", label: "No commute" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCommuteFilter(item.value as CommuteFilter)}
              className={cn(
                "h-9 rounded-lg border px-3 text-xs font-semibold cursor-pointer transition-colors",
                commuteFilter === item.value
                  ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {shareMessage && (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-300">
          {shareMessage}
        </p>
      )}

      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Activity className="mb-2 h-7 w-7 opacity-40" />
              <p className="text-sm font-semibold">No entries match these filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.date} className="rounded-2xl border-border bg-card shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    entry.workout_done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/40"
                  )}
                >
                  {entry.workout_done ? <Dumbbell className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">
                      {new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-300">
                      Score {entry.life_score}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
                      <Car className="h-3 w-3" />
                      {entry.commute_day ? "Commute" : "No commute"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.workout_done
                      ? `${entry.exercise_duration || 0} min ${entry.workout_type || "workout"}`
                      : "No workout logged"}
                    {" - "}
                    Mood {entry.mood_label} - Energy {entry.energy_level || 0}/10 - Stress {entry.stress_level || 0}/10
                  </p>
                </div>
                {entry.workout_selfie && (
                  <button
                    type="button"
                    onClick={() => setSelfieModal(entry.workout_selfie!)}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-200 cursor-pointer"
                    title="View workout selfie"
                  >
                    <img src={entry.workout_selfie} alt="Workout selfie" className="h-full w-full object-cover" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selfieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelfieModal(null)}>
          <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
            <img src={selfieModal} alt="Workout selfie" className="w-full rounded-2xl border-4 border-white/20 shadow-2xl" />
            <button
              type="button"
              onClick={() => setSelfieModal(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
