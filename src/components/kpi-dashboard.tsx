import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry } from "@/store/useLifeStore";
import { TrendingUp, Moon, Brain, Zap, Focus, Flame } from "lucide-react";

interface KPIDashboardProps {
  entries: LogEntry[];
}

export function KPIDashboard({ entries }: KPIDashboardProps) {
  if (entries.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-white border-slate-100 shadow-sm animate-pulse rounded-2xl">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const totalEntries = entries.length;
  const avgMood = (entries.reduce((acc, curr) => acc + curr.mood_score, 0) / totalEntries).toFixed(1);
  const avgSleep = (entries.reduce((acc, curr) => acc + (curr.sleep_hours || 0), 0) / totalEntries).toFixed(1);
  const avgProductivity = (entries.reduce((acc, curr) => acc + (curr.productivity_level || 0), 0) / totalEntries).toFixed(1);
  const avgFocus = (entries.reduce((acc, curr) => acc + (curr.focus_level || 0), 0) / totalEntries).toFixed(1);
  const avgLifeScore = (entries.reduce((acc, curr) => acc + curr.life_score, 0) / totalEntries).toFixed(1);

  // Streak calculation
  const sortedDates = [...entries]
    .map((e) => new Date(e.date).setHours(0, 0, 0, 0))
    .sort((a, b) => b - a);

  const oneDayInMs = 24 * 60 * 60 * 1000;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  let tempStreak = 0;
  let checkDate = todayStart;

  for (let i = 0; i < sortedDates.length; i++) {
    const diff = Math.abs(checkDate - sortedDates[i]);
    if (diff <= oneDayInMs) {
      tempStreak++;
      checkDate = sortedDates[i];
    } else if (i === 0 && Math.abs(todayStart - oneDayInMs - sortedDates[i]) <= oneDayInMs) {
      tempStreak++;
      checkDate = sortedDates[i];
    } else {
      break;
    }
  }
  const currentStreak = tempStreak;

  const kpis = [
    {
      label: "Life Score",
      value: avgLifeScore,
      sub: "overall avg",
      icon: Flame,
      color: "text-teal-600",
      bg: "bg-teal-50",
      ring: "ring-teal-200",
    },
    {
      label: "Avg Mood",
      value: `${avgMood}/8`,
      sub: "subjective",
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    },
    {
      label: "Avg Sleep",
      value: `${avgSleep}h`,
      sub: "duration",
      icon: Moon,
      color: "text-sky-600",
      bg: "bg-sky-50",
      ring: "ring-sky-200",
    },
    {
      label: "Productivity",
      value: `${avgProductivity}/10`,
      sub: "output avg",
      icon: Brain,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    },
    {
      label: "Focus",
      value: `${avgFocus}/10`,
      sub: "bandwidth",
      icon: Zap,
      color: "text-violet-600",
      bg: "bg-violet-50",
      ring: "ring-violet-200",
    },
    {
      label: "Streak",
      value: `${currentStreak}d`,
      sub: "consecutive",
      icon: Focus,
      color: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="bg-white border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </CardTitle>
                <div className={`h-7 w-7 flex items-center justify-center rounded-lg ${kpi.bg} ring-1 ${kpi.ring}`}>
                  <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
