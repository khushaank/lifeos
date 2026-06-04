import type { LogEntry } from "@/store/useLifeStore";

export type CoachMessage = {
  id: string;
  tone: "positive" | "neutral" | "caution";
  text: string;
};

const YOUTUBE_RE =
  /\b(youtube|yt\b|youtu\.be|netflix|instagram|tiktok|twitter|x\.com|reddit|scroll|doomscroll|distraction)\b/i;

function parseTimeToMinutes(t?: string): number | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function weekRange(offsetWeeks: number): { start: string; end: string } {
  const end = new Date();
  end.setDate(end.getDate() - offsetWeeks * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

function entriesBetween(entries: LogEntry[], start: string, end: string) {
  return entries.filter((e) => e.date >= start && e.date <= end);
}

function textBlob(e: LogEntry): string {
  return [e.notes, e.challenges, e.wins, e.study_topic].filter(Boolean).join(" ");
}

function formatBlock(startMin: number): string {
  const h = Math.floor(startMin / 60);
  const m = startMin % 60;
  const endMin = startMin + 90;
  const eh = Math.floor(endMin / 60) % 24;
  const em = endMin % 60;
  const fmt = (hh: number, mm: number) => {
    const ap = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 || 12;
    return `${h12}:${mm.toString().padStart(2, "0")} ${ap}`;
  };
  return `${fmt(h, m)}–${fmt(eh, em)}`;
}

export function generateCoachMessages(entries: LogEntry[]): CoachMessage[] {
  const messages: CoachMessage[] = [];
  if (entries.length < 3) {
    return [
      {
        id: "welcome",
        tone: "neutral",
        text: "Log a few more check-ins and I'll start spotting patterns in your habits.",
      },
    ];
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const thisWeek = weekRange(0);
  const lastWeek = weekRange(1);
  const weekEntries = entriesBetween(sorted, thisWeek.start, thisWeek.end);
  const prevWeekEntries = entriesBetween(sorted, lastWeek.start, lastWeek.end);

  const studyThis = weekEntries.reduce((s, e) => s + (e.study_hours || 0), 0);
  const studyPrev = prevWeekEntries.reduce((s, e) => s + (e.study_hours || 0), 0);
  if (studyThis > 0 || studyPrev > 0) {
    const delta = studyThis - studyPrev;
    const abs = Math.abs(delta).toFixed(1);
    if (Math.abs(delta) >= 0.5) {
      if (delta < 0) {
        messages.push({
          id: "study-week-less",
          tone: "caution",
          text: `You studied ${abs} hours less this week than last week.`,
        });
      } else {
        messages.push({
          id: "study-week-more",
          tone: "positive",
          text: `You studied ${abs} hours more this week — nice momentum.`,
        });
      }
    } else {
      messages.push({
        id: "study-week-stable",
        tone: "neutral",
        text: `Study time is steady this week (${studyThis.toFixed(1)}h total).`,
      });
    }
  }

  const studyDays = sorted.filter((e) => (e.study_hours || 0) > 0);
  if (studyDays.length >= 3) {
    const withDistraction = studyDays.filter((e) => YOUTUBE_RE.test(textBlob(e)));
    const pct = Math.round((withDistraction.length / studyDays.length) * 100);
    if (pct >= 40) {
      messages.push({
        id: "youtube-notes",
        tone: "caution",
        text: `On ${pct}% of study days, your notes mention YouTube or distractions — worth guarding focus.`,
      });
    }

    const earlyStudy = studyDays.filter((e) => {
      const wake = parseTimeToMinutes(e.wake_time);
      return wake !== null && wake <= 9 * 60 + 30;
    });
    const earlyPct = Math.round((earlyStudy.length / studyDays.length) * 100);
    if (earlyPct >= 50 && earlyStudy.length >= 2) {
      messages.push({
        id: "early-study",
        tone: "positive",
        text: `You tend to start days early on study days (${earlyPct}% logged before 9:30 AM wake).`,
      });
    }
  }

  const blockScores = new Map<string, { sum: number; count: number }>();
  for (const e of studyDays) {
    const wake = parseTimeToMinutes(e.wake_time);
    if (wake === null) continue;
    const blockStart = Math.floor(wake / 90) * 90;
    const key = String(blockStart);
    const cur = blockScores.get(key) ?? { sum: 0, count: 0 };
    cur.sum += e.study_hours || 0;
    cur.count += 1;
    blockScores.set(key, cur);
  }
  if (blockScores.size >= 1) {
    let bestKey = "";
    let bestAvg = -1;
    for (const [key, { sum, count }] of blockScores) {
      const avg = sum / count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestKey = key;
      }
    }
    if (bestKey && bestAvg > 0) {
      messages.push({
        id: "best-study-block",
        tone: "positive",
        text: `Your highest-performing study block is around ${formatBlock(parseInt(bestKey, 10))} (avg ${bestAvg.toFixed(1)}h logged).`,
      });
    }
  }

  const last14 = sorted.slice(-14);
  const avgSleep =
    last14.reduce((s, e) => s + (e.sleep_hours || 0), 0) / Math.max(last14.length, 1);
  if (avgSleep > 0 && avgSleep < 6.5) {
    messages.push({
      id: "sleep-low",
      tone: "caution",
      text: `Average sleep is ${avgSleep.toFixed(1)}h over the last two weeks — recovery may be limiting focus.`,
    });
  } else if (avgSleep >= 7.5) {
    messages.push({
      id: "sleep-good",
      tone: "positive",
      text: `Sleep is solid at ${avgSleep.toFixed(1)}h on average — keep protecting that window.`,
    });
  }

  const workoutDays = last14.filter((e) => e.workout_done).length;
  if (workoutDays >= 4) {
    messages.push({
      id: "workout-strong",
      tone: "positive",
      text: `You worked out ${workoutDays} of the last ${last14.length} days — strong movement habit.`,
    });
  }

  const stressHigh = last14.filter((e) => (e.stress_level || 0) >= 8).length;
  if (stressHigh >= 4) {
    messages.push({
      id: "stress-high",
      tone: "caution",
      text: `Stress hit 8+ on ${stressHigh} recent days — consider a lighter day or extra sleep.`,
    });
  }

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const dateSet = new Set(sorted.map((e) => e.date));
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (dateSet.has(key)) streak++;
    else if (key !== today) break;
  }
  if (streak >= 3) {
    messages.push({
      id: "checkin-streak",
      tone: "positive",
      text: `You're on a ${streak}-day check-in streak. Consistency compounds.`,
    });
  }

  if (messages.length === 0) {
    messages.push({
      id: "baseline",
      tone: "neutral",
      text: "Keep logging daily — I'm watching for study, sleep, and stress patterns.",
    });
  }

  return messages.slice(0, 6);
}
