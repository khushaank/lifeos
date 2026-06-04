"use client";

import { useEffect, useCallback } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import { todayString, experimentProgress } from "@/lib/experiments";

const NOTIFY_KEY = "lifeos-exp-notify";

function notifiedToday(experimentId: string, date: string) {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(NOTIFY_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    return map[experimentId] === date;
  } catch {
    return false;
  }
}

function markNotified(experimentId: string, date: string) {
  try {
    const raw = localStorage.getItem(NOTIFY_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[experimentId] = date;
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function useExperimentNotifications() {
  const experiments = useLifeStore((s) => s.experiments);

  const fireReminders = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const today = todayString();
    const hour = new Date().getHours();

    for (const exp of experiments) {
      const prog = experimentProgress(exp);
      if (prog.isExpired || !exp.notify_enabled) continue;
      if (hour < exp.notify_hour) continue;
      if (prog.answeredToday) continue;
      if (notifiedToday(exp.id, today)) continue;

      new Notification(`90-day challenge · ${exp.title}`, {
        body: exp.daily_prompt,
        tag: `lifeos-exp-${exp.id}-${today}`,
        icon: "/icon.png",
      });
      markNotified(exp.id, today);
    }
  }, [experiments]);

  useEffect(() => {
    fireReminders();
    const id = window.setInterval(fireReminders, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [fireReminders]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  }, []);

  return { requestPermission, fireReminders };
}
