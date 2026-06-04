"use client";

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogEntry } from "@/store/useLifeStore";
import { ChartContainer } from "@/components/chart-container";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface TrendChartsProps {
  entries: LogEntry[];
}

function TrendChartsComponent({ entries }: TrendChartsProps) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("7d");

  const filteredEntries = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(timeframe === "7d" ? -7 : timeframe === "30d" ? -30 : 0);

  if (entries.length === 0) return null;

  const chartData = filteredEntries.map((e) => ({
    ...e,
    displayDate: new Date(e.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    color: "#1e293b",
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-700 px-1">Timeline & Trends</h2>
        <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
          {(["7d", "30d", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
                timeframe === t
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mood vs Life Score */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">Mood vs. Life Score</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Mood (1–8 scale) alongside overall life score (0–100)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={260}>
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLifeLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMoodLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} domain={[1, 8]} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="life_score" name="Life Score" stroke="#14b8a6" strokeWidth={2} fill="url(#colorLifeLight)" />
                  <Area yAxisId="right" type="monotone" dataKey="mood_score" name="Mood (1–8)" stroke="#f59e0b" strokeWidth={2} fill="url(#colorMoodLight)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Sleep vs Productivity */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">Sleep & Productivity</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Sleep duration (hours) against productivity rating (1–10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={260}>
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} domain={[0, 12]} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} domain={[1, 10]} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="sleep_hours" name="Sleep Hours" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: "#38bdf8" }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="productivity_level" name="Productivity" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3, fill: "#34d399" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const TrendCharts = memo(TrendChartsComponent);
