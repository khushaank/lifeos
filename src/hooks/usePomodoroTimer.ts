"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import {
  formatTimerDisplay,
  todayDateString,
  type FocusTimerClientState,
  type TimerStatus,
} from "@/lib/focus-timer";

export type PomodoroPreset = {
  label: string;
  minutes: number;
  description: string;
};

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { label: "Short break", minutes: 5, description: "Quick reset" },
  { label: "Break", minutes: 15, description: "Recharge" },
  { label: "Pomodoro", minutes: 25, description: "Classic focus" },
  { label: "Focus", minutes: 45, description: "Extended block" },
  { label: "Deep work", minutes: 90, description: "Long session" },
];

export type { TimerStatus };

function buildRunningState(
  base: FocusTimerClientState,
  secondsLeft: number
): FocusTimerClientState {
  return {
    ...base,
    status: "running",
    remainingSeconds: secondsLeft,
    endsAt: new Date(Date.now() + secondsLeft * 1000).toISOString(),
  };
}

export function usePomodoroTimer() {
  const timer = useLifeStore((s) => s.focusTimer);
  const isSyncingTimer = useLifeStore((s) => s.isSyncingTimer);
  const fetchFocusTimer = useLifeStore((s) => s.fetchFocusTimer);
  const saveFocusTimer = useLifeStore((s) => s.saveFocusTimer);
  const setFocusTimerLocal = useLifeStore((s) => s.setFocusTimerLocal);

  const localLockUntil = useRef(0);
  const prevStatusRef = useRef<TimerStatus>(timer.status);

  const lockLocal = () => {
    localLockUntil.current = Date.now() + 800;
  };

  useEffect(() => {
    fetchFocusTimer();
  }, [fetchFocusTimer]);

  useEffect(() => {
    const poll = () => {
      if (Date.now() < localLockUntil.current) return;
      fetchFocusTimer();
    };

    poll();
    const id = setInterval(poll, 2500);
    return () => clearInterval(id);
  }, [fetchFocusTimer]);

  useEffect(() => {
    if (timer.status !== "running") return;

    const id = setInterval(() => {
      if (timer.endsAt) {
        const left = Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - Date.now()) / 1000));
        if (left !== timer.remainingSeconds) {
          setFocusTimerLocal({ remainingSeconds: left });
        }
        if (left <= 0 && timer.status === "running") {
          const today = todayDateString();
          const nextCount =
            timer.sessionsCompletedDate === today
              ? timer.sessionsCompletedCount + 1
              : 1;
          saveFocusTimer({
            ...timer,
            status: "completed",
            endsAt: null,
            remainingSeconds: 0,
            sessionsCompletedDate: today,
            sessionsCompletedCount: nextCount,
          });
        }
      }
    }, 200);

    return () => clearInterval(id);
  }, [timer, setFocusTimerLocal, saveFocusTimer]);

  useEffect(() => {
    if (prevStatusRef.current !== "completed" && timer.status === "completed") {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Focus session complete", {
          body: `Your ${timer.selectedMinutes}-minute session is done.`,
        });
      }
    }
    prevStatusRef.current = timer.status;
  }, [timer.status, timer.selectedMinutes]);

  const selectPreset = useCallback(
    async (minutes: number) => {
      lockLocal();
      const next: FocusTimerClientState = {
        selectedMinutes: minutes,
        status: "idle",
        endsAt: null,
        remainingSeconds: minutes * 60,
        sessionsCompletedDate: timer.sessionsCompletedDate,
        sessionsCompletedCount: timer.sessionsCompletedCount,
      };
      setFocusTimerLocal(next);
      await saveFocusTimer(next);
    },
    [saveFocusTimer, setFocusTimerLocal, timer.sessionsCompletedCount, timer.sessionsCompletedDate]
  );

  const start = useCallback(async () => {
    if (timer.status === "running") return;
    lockLocal();

    const secondsLeft =
      timer.status === "paused" || timer.status === "completed"
        ? timer.status === "completed"
          ? timer.selectedMinutes * 60
          : timer.remainingSeconds
        : timer.selectedMinutes * 60;

    const next = buildRunningState(
      { ...timer, remainingSeconds: secondsLeft },
      secondsLeft
    );
    setFocusTimerLocal(next);
    await saveFocusTimer(next);
  }, [saveFocusTimer, setFocusTimerLocal, timer]);

  const pause = useCallback(async () => {
    if (timer.status !== "running" || !timer.endsAt) return;
    lockLocal();

    const left = Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - Date.now()) / 1000));
    const next: FocusTimerClientState = {
      ...timer,
      status: "paused",
      endsAt: null,
      remainingSeconds: left,
    };
    setFocusTimerLocal(next);
    await saveFocusTimer(next);
  }, [saveFocusTimer, setFocusTimerLocal, timer]);

  const reset = useCallback(async () => {
    lockLocal();
    const next: FocusTimerClientState = {
      ...timer,
      status: "idle",
      endsAt: null,
      remainingSeconds: timer.selectedMinutes * 60,
    };
    setFocusTimerLocal(next);
    await saveFocusTimer(next);
  }, [saveFocusTimer, setFocusTimerLocal, timer]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  const totalSeconds = timer.selectedMinutes * 60;
  const progress =
    totalSeconds > 0 ? ((totalSeconds - timer.remainingSeconds) / totalSeconds) * 100 : 0;

  return {
    presets: POMODORO_PRESETS,
    selectedMinutes: timer.selectedMinutes,
    remainingSeconds: timer.remainingSeconds,
    formattedTime: formatTimerDisplay(timer.remainingSeconds),
    status: timer.status,
    progress,
    sessionsCompleted: timer.sessionsCompletedCount,
    isSyncing: isSyncingTimer,
    selectPreset,
    start,
    pause,
    reset,
    requestNotificationPermission,
    refresh: fetchFocusTimer,
  };
}
