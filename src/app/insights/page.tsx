"use client";

import { useLifeStore } from "@/store/useLifeStore";
import { CorrelationDashboard } from "@/components/correlation-dashboard";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Sparkles, ShieldCheck, AlertTriangle, Zap, Info, type LucideIcon } from "lucide-react";
import { calculatePearson } from "@/lib/correlation";

interface InsightCard {
  title: string;
  desc: string;
  type: "positive" | "caution" | "burnout" | "neutral";
  icon: LucideIcon;
}

export default function InsightsPage() {
  const entries = useLifeStore((state) => state.entries);

  const generateInsights = (): InsightCard[] => {
    const list: InsightCard[] = [];

    if (entries.length < 5) {
      return [{
        title: "Not Enough Data Yet",
        desc: "Log at least 5 daily check-ins to unlock the AI heuristic engine. Your insights are generated locally from your private entries.",
        type: "neutral",
        icon: Info,
      }];
    }

    const last30 = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    const count = last30.length;

    const avgSleep = last30.reduce((s, c) => s + (c.sleep_hours || 0), 0) / count;
    const avgStress = last30.reduce((s, c) => s + (c.stress_level || 0), 0) / count;
    const avgMood = last30.reduce((s, c) => s + (c.mood_score || 0), 0) / count;
    const avgProductivity = last30.reduce((s, c) => s + (c.productivity_level || 0), 0) / count;
    const workoutCount = last30.filter((c) => c.workout_done).length;
    const workoutRatio = workoutCount / count;

    const sleepArr = last30.map((e) => e.sleep_hours || 0);
    const prodArr = last30.map((e) => e.productivity_level || 0);
    const stressArr = last30.map((e) => e.stress_level || 0);
    const moodArr = last30.map((e) => e.mood_score || 0);

    const sleepProdR = calculatePearson(sleepArr, prodArr);
    const stressMoodR = calculatePearson(stressArr, moodArr);

    if (sleepProdR > 0.45) {
      list.push({
        title: "💤 Sleep Fuels Your Output",
        desc: `Strong link found (r=${sleepProdR.toFixed(2)}) between your sleep hours and productivity score. Protecting your 7–9 hour sleep window could directly boost your work output.`,
        type: "positive",
        icon: Zap,
      });
    }

    if (avgStress > 7 && avgSleep < 6.5) {
      list.push({
        title: "🔥 Burnout Risk Detected",
        desc: `Your average stress is ${avgStress.toFixed(1)}/10 alongside low sleep (${avgSleep.toFixed(1)} hrs avg). You may be approaching burnout. Consider scheduling active recovery and reducing commitments.`,
        type: "burnout",
        icon: AlertTriangle,
      });
    } else if (avgStress > 6) {
      list.push({
        title: "⚠️ Elevated Stress Pattern",
        desc: `Stress averages ${avgStress.toFixed(1)}/10 over the past ${count} days. Integrating a 5-min daily mindfulness routine can help lower baseline levels.`,
        type: "caution",
        icon: AlertTriangle,
      });
    }

    if (workoutRatio >= 0.5) {
      list.push({
        title: "🏋️ Strong Exercise Consistency",
        desc: `You've worked out ${workoutCount} of ${count} days (${Math.round(workoutRatio * 100)}%). This level of activity is actively boosting your life score and mood stability.`,
        type: "positive",
        icon: ShieldCheck,
      });
    } else if (workoutRatio < 0.2 && count >= 10) {
      list.push({
        title: "🚶 Activity Level Low",
        desc: `Only ${Math.round(workoutRatio * 100)}% workout frequency logged. Even a 15–20 min daily walk has measurable positive impact on mood and energy.`,
        type: "caution",
        icon: AlertTriangle,
      });
    }

    if (stressMoodR < -0.45) {
      list.push({
        title: "😔 Stress Suppresses Mood",
        desc: `Your mood is highly sensitive to stress levels (r=${stressMoodR.toFixed(2)}). Stress management on rough days could prevent mood dips and maintain performance.`,
        type: "caution",
        icon: TrendingUp,
      });
    }

    if (avgMood >= 6 && avgProductivity >= 7) {
      list.push({
        title: "⭐ High Performance Zone",
        desc: `You're averaging ${avgMood.toFixed(1)}/8 mood and ${avgProductivity.toFixed(1)}/10 productivity. You're operating in a high-performance zone — keep your current habits consistent.`,
        type: "positive",
        icon: Sparkles,
      });
    }

    if (list.length === 0) {
      list.push({
        title: "📊 Baseline Stable",
        desc: "Your health indicators are holding steady. Continue checking in daily to uncover hidden patterns in your lifestyle data.",
        type: "neutral",
        icon: Sparkles,
      });
    }

    return list;
  };

  const insights = generateInsights();

  const insightStyles: Record<InsightCard["type"], { bg: string; border: string; badge: string; badgeText: string }> = {
    positive: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100", badgeText: "text-emerald-700" },
    caution: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100", badgeText: "text-amber-700" },
    burnout: { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100", badgeText: "text-rose-700" },
    neutral: { bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100", badgeText: "text-slate-600" },
  };

  const badgeLabels: Record<InsightCard["type"], string> = {
    positive: "✓ Positive Pattern",
    caution: "⚠ Caution",
    burnout: "🔴 High Risk",
    neutral: "ℹ Info",
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans md:pl-64 pb-20">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-violet-50 ring-1 ring-violet-200 flex items-center justify-center">
              <Brain className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AI Insights</h1>
              <p className="text-sm text-slate-500">Heuristic patterns compiled from your logged data</p>
            </div>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-700 px-1 flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" /> AI Analytical Feed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, idx) => {
              const Icon = insight.icon;
              const style = insightStyles[insight.type];
              return (
                <Card key={idx} className={`${style.bg} border ${style.border} rounded-2xl shadow-sm`}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-bold text-slate-800 leading-tight">{insight.title}</CardTitle>
                      <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${style.badge} ${style.badgeText} whitespace-nowrap`}>
                        {badgeLabels[insight.type]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    <p className="text-xs text-slate-600 leading-relaxed">{insight.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Correlation Dashboard */}
        <CorrelationDashboard entries={entries} />
      </main>
    </div>
  );
}
