export type HeatmapDay = {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type HeatmapSeries = {
  id: string;
  label: string;
  description: string;
  days: HeatmapDay[];
  total: number;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildDateRange(weeks = 52): string[] {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);
  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Absolute 0–100 mega scores → heat levels (GitHub-style fixed scale). */
export function scoresToLevels(dates: string[], valueByDate: Map<string, number>): HeatmapDay[] {
  return dates.map((date) => {
    const value = valueByDate.get(date) ?? 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (value >= 80) level = 4;
    else if (value >= 60) level = 3;
    else if (value >= 35) level = 2;
    else if (value > 0) level = 1;
    return { date, value, level };
  });
}

export function valuesToLevels(
  dates: string[],
  valueByDate: Map<string, number>,
  maxLevel = 4
): HeatmapDay[] {
  const values = dates.map((d) => valueByDate.get(d) ?? 0);
  const max = Math.max(...values, 1);

  return dates.map((date) => {
    const value = valueByDate.get(date) ?? 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (value > 0) {
      const ratio = value / max;
      if (ratio >= 0.85) level = 4;
      else if (ratio >= 0.6) level = 3;
      else if (ratio >= 0.35) level = 2;
      else level = 1;
    }
    return { date, value, level };
  });
}

export function countByDate(items: { date: string }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.date, (map.get(item.date) ?? 0) + 1);
  }
  return map;
}

export function scalarByDate(
  items: { date: string; value: number }[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.date, item.value);
  }
  return map;
}

export function groupWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  let current: HeatmapDay[] = [];
  for (const day of days) {
    const dow = new Date(`${day.date}T12:00:00`).getDay();
    if (current.length > 0 && dow === 0) {
      weeks.push(current);
      current = [];
    }
    current.push(day);
  }
  if (current.length) weeks.push(current);
  return weeks;
}
