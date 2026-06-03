"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogEntry } from "@/store/useLifeStore";
import { calculatePearson, calculateBinaryImpact } from "@/lib/correlation";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface CorrelationDashboardProps {
  entries: LogEntry[];
}

export function CorrelationDashboard({ entries }: CorrelationDashboardProps) {
  const [selectedPair, setSelectedPair] = useState<{
    xKey: keyof LogEntry;
    yKey: keyof LogEntry;
    xName: string;
    yName: string;
  }>({
    xKey: "sleep_hours",
    yKey: "productivity_level",
    xName: "Sleep Hours",
    yName: "Productivity Level",
  });

  if (entries.length < 3) {
    return (
      <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="flex h-48 items-center justify-center text-slate-400 text-sm">
          Need at least 3 check-ins to generate correlations.
        </CardContent>
      </Card>
    );
  }

  const getNumber = (entry: LogEntry, key: keyof LogEntry) => {
    const value = entry[key];
    return typeof value === "number" ? value : Number(value) || 0;
  };

  const getArray = (key: keyof LogEntry): number[] => entries.map((entry) => getNumber(entry, key));

  const sleepArr = getArray("sleep_hours");
  const moodArr = getArray("mood_score");
  const prodArr = getArray("productivity_level");
  const focusArr = getArray("focus_level");
  const stressArr = getArray("stress_level");

  const correlations = [
    { name: "Sleep & Productivity", coef: calculatePearson(sleepArr, prodArr), xKey: "sleep_hours" as keyof LogEntry, yKey: "productivity_level" as keyof LogEntry, xName: "Sleep Hours", yName: "Productivity" },
    { name: "Sleep & Mood", coef: calculatePearson(sleepArr, moodArr), xKey: "sleep_hours" as keyof LogEntry, yKey: "mood_score" as keyof LogEntry, xName: "Sleep Hours", yName: "Mood Score" },
    { name: "Focus & Productivity", coef: calculatePearson(focusArr, prodArr), xKey: "focus_level" as keyof LogEntry, yKey: "productivity_level" as keyof LogEntry, xName: "Focus Level", yName: "Productivity" },
    { name: "Stress & Sleep Quality", coef: calculatePearson(stressArr, entries.map(e => e.sleep_quality || 0)), xKey: "stress_level" as keyof LogEntry, yKey: "sleep_quality" as keyof LogEntry, xName: "Stress Level", yName: "Sleep Quality" },
  ];

  const workoutMoodImpact = calculateBinaryImpact(entries, "workout_done", "mood_score");
  const junkFoodLifeImpact = calculateBinaryImpact(entries, "junk_food", "life_score");
  const workoutEnergyImpact = calculateBinaryImpact(entries, "workout_done", "energy_level");

  const scatterData = entries.map((e) => ({
    x: getNumber(e, selectedPair.xKey),
    y: getNumber(e, selectedPair.yKey),
  }));

  const getCoeffLabel = (r: number) => {
    const abs = Math.abs(r);
    if (abs >= 0.7) return r > 0 ? "Strong positive" : "Strong negative";
    if (abs >= 0.4) return r > 0 ? "Moderate positive" : "Moderate negative";
    if (abs >= 0.1) return r > 0 ? "Weak positive" : "Weak negative";
    return "No correlation";
  };

  const getCoeffColor = (r: number) => {
    const abs = Math.abs(r);
    if (abs < 0.1) return "text-slate-400";
    return r > 0 ? "text-teal-600 font-bold" : "text-rose-600 font-bold";
  };

  const tooltipStyle = {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-700 px-1">Correlation & Habit Impact Analysis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pearson Matrix */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">Pearson Correlation Matrix</CardTitle>
            <CardDescription className="text-xs text-slate-400">Click a pair to view scatter distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {correlations.map((c) => {
              const isSelected = selectedPair.xKey === c.xKey && selectedPair.yKey === c.yKey;
              return (
                <div
                  key={c.name}
                  onClick={() => setSelectedPair({ xKey: c.xKey, yKey: c.yKey, xName: c.xName, yName: c.yName })}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-teal-50 border-teal-300 shadow-sm"
                      : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700">{c.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{getCoeffLabel(c.coef)}</p>
                  </div>
                  <div className={`text-sm ${getCoeffColor(c.coef)}`}>
                    {c.coef > 0 ? "+" : ""}
                    {c.coef.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Scatter Plot */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">
              {selectedPair.xName} vs {selectedPair.yName}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Each dot represents one day&apos;s log entry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 15, bottom: 10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name={selectedPair.xName} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} label={{ value: selectedPair.xName, position: "insideBottom", offset: -5, fill: "#94a3b8", style: { fontSize: 10 } }} />
                  <YAxis type="number" dataKey="y" name={selectedPair.yName} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="Days" data={scatterData} fill="#14b8a6" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Binary Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Workout → Mood",
            change: workoutMoodImpact.percentChange,
            yes: workoutMoodImpact.yesMean.toFixed(1),
            no: workoutMoodImpact.noMean.toFixed(1),
            yesLabel: "Workout days",
            noLabel: "Rest days",
            metric: "avg mood",
            color: "teal",
          },
          {
            label: "Junk Food → Life Score",
            change: junkFoodLifeImpact.percentChange,
            yes: junkFoodLifeImpact.yesMean.toFixed(1),
            no: junkFoodLifeImpact.noMean.toFixed(1),
            yesLabel: "Junk food days",
            noLabel: "Clean days",
            metric: "avg score",
            color: junkFoodLifeImpact.percentChange <= 0 ? "rose" : "teal",
          },
          {
            label: "Workout → Energy",
            change: workoutEnergyImpact.percentChange,
            yes: workoutEnergyImpact.yesMean.toFixed(1),
            no: workoutEnergyImpact.noMean.toFixed(1),
            yesLabel: "Workout days",
            noLabel: "Rest days",
            metric: "avg energy",
            color: "sky",
          },
        ].map((impact) => (
          <Card key={impact.label} className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{impact.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-black ${impact.change >= 0 ? "text-teal-600" : "text-rose-600"}`}>
                {impact.change >= 0 ? "+" : ""}{impact.change}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {impact.yesLabel}: {impact.yes} · {impact.noLabel}: {impact.no} ({impact.metric})
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
