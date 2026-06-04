"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { cn } from "@/lib/utils";
import { Bell, CheckSquare, Pause, Play, RotateCcw } from "lucide-react";

const RING_SIZE = 280;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PomodoroTimer() {
  const {
    presets,
    selectedMinutes,
    formattedTime,
    status,
    progress,
    sessionsCompleted,
    isSyncing,
    selectPreset,
    start,
    pause,
    reset,
    requestNotificationPermission,
  } = usePomodoroTimer();

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isCompleted = status === "completed";
  const canChangePreset = status === "idle" || status === "completed";

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-slate-800">Focus Timer</CardTitle>
          <CardDescription className="flex flex-col items-center gap-1">
            {isSyncing && (
              <span className="text-[10px] text-teal-600 font-medium">Syncing across devices…</span>
            )}
            {isCompleted
              ? "Session complete — take a break or start another round"
              : isRunning
                ? "Stay focused until the timer ends"
                : isPaused
                  ? "Paused — resume when you are ready"
                  : "Pick a duration and start your focus block"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 pb-10">
          <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              className="-rotate-90"
              aria-hidden
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={STROKE}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#14b8a6"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-300 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "font-mono text-5xl font-bold tracking-tight tabular-nums",
                  isCompleted ? "text-teal-600" : "text-slate-800"
                )}
              >
                {formattedTime}
              </span>
              <span className="mt-1 text-sm font-medium text-slate-500">
                {selectedMinutes} min
                {isCompleted && " · done"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 w-full max-w-md">
            {presets.map((preset) => {
              const selected = selectedMinutes === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  type="button"
                  disabled={!canChangePreset}
                  onClick={() => selectPreset(preset.minutes)}
                  title={preset.description}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    selected
                      ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="font-semibold">{preset.minutes}</span>
                  <span className="ml-1 text-xs opacity-80">min</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 text-center -mt-4">
            {presets.find((p) => p.minutes === selectedMinutes)?.label} —{" "}
            {presets.find((p) => p.minutes === selectedMinutes)?.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isRunning ? (
              <Button
                onClick={start}
                className="bg-teal-500 hover:bg-teal-600 text-white h-11 px-8 rounded-xl cursor-pointer"
              >
                <Play className="h-4 w-4 mr-2" />
                {isPaused ? "Resume" : isCompleted ? "Start again" : "Start"}
              </Button>
            ) : (
              <Button
                onClick={pause}
                variant="outline"
                className="h-11 px-8 rounded-xl border-slate-200 cursor-pointer"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={reset}
              variant="outline"
              disabled={status === "idle"}
              className="h-11 px-6 rounded-xl border-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {sessionsCompleted > 0 && (
            <p className="text-sm text-slate-500">
              {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} completed today
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="flex items-start gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <Bell className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Desktop notifications</p>
              <p className="text-xs text-slate-500 mt-1">
                Get alerted when a session ends. Permission is requested on first visit.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-slate-200 cursor-pointer"
                onClick={() => requestNotificationPermission()}
              >
                Enable notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="flex items-start gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <CheckSquare className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Log your focus</p>
              <p className="text-xs text-slate-500 mt-1">
                After a session, update today&apos;s focus and productivity in your daily check-in.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 border-slate-200 cursor-pointer"
              >
                <Link href="/check-in">Go to Check-In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
