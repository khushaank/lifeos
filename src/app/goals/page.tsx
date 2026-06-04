"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { useLifeStore, type LifeGoal, type GoalMetric } from "@/store/useLifeStore";
import { useSyncLifeData } from "@/hooks/use-sync-life-data";
import {
  enrichGoalsWithProgress,
  METRIC_OPTIONS,
  GOAL_COLORS,
} from "@/lib/goal-progress";
import { GoalsSkeleton } from "@/components/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyForm = (): Omit<LifeGoal, "id"> => ({
  title: "",
  target: "",
  progress: 0,
  color: GOAL_COLORS[0],
  deadline: null,
  description: "",
  metric: "study_hours_weekly",
  target_value: 14,
  unit: "hrs",
});

function daysUntil(deadline?: string | null) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

export default function GoalsPage() {
  const goals = useLifeStore((s) => s.goals);
  const entries = useLifeStore((s) => s.entries);
  const isSyncing = useLifeStore((s) => s.isSyncing);
  const addGoal = useLifeStore((s) => s.addGoal);
  const updateGoal = useLifeStore((s) => s.updateGoal);
  const deleteGoal = useLifeStore((s) => s.deleteGoal);

  useSyncLifeData();

  const enriched = useMemo(() => enrichGoalsWithProgress(goals, entries), [goals, entries]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (g: LifeGoal) => {
    setEditingId(g.id);
    setForm({
      title: g.title,
      target: g.target,
      progress: g.progress,
      color: g.color,
      deadline: g.deadline ?? null,
      description: g.description ?? "",
      metric: g.metric ?? "custom",
      target_value: g.target_value ?? 100,
      unit: g.unit ?? "",
    });
    setFormOpen(true);
  };

  const onMetricChange = (metric: GoalMetric) => {
    const opt = METRIC_OPTIONS.find((m) => m.value === metric);
    setForm((f) => ({
      ...f,
      metric,
      target_value: opt?.defaultTarget ?? f.target_value,
      unit: opt?.unit ?? "",
      target: opt
        ? `${opt.defaultTarget} ${opt.unit}${metric.includes("weekly") ? " / week" : metric.includes("daily") ? " / day" : ""}`
        : f.target,
      progress: metric === "custom" ? f.progress : 0,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      target: form.target.trim() || `${form.target_value} ${form.unit || ""}`.trim(),
    };
    if (editingId) {
      await updateGoal(editingId, payload);
    } else {
      await addGoal(payload);
    }
    setSaving(false);
    setFormOpen(false);
  };

  const showSkeleton = isSyncing && goals.length === 0 && entries.length === 0;

  return (
    <PageShell maxWidth="3xl" mainClassName="space-y-6">
      <div className="flex justify-start">
        <Button onClick={openNew} className="cursor-pointer bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New goal
        </Button>
      </div>

      {formOpen && (
        <Card className="rounded-2xl border-teal-200 dark:border-teal-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{editingId ? "Edit goal" : "Add goal"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Pass certification exam"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Track with</Label>
                <select
                  value={form.metric ?? "custom"}
                  onChange={(e) => onMetricChange(e.target.value as GoalMetric)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {METRIC_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value || null }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Target value</Label>
                <Input
                  type="number"
                  value={form.target_value ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Display target</Label>
                <Input
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                  placeholder="2 hrs / day"
                />
              </div>
              {form.metric === "custom" && (
                <div className="space-y-2">
                  <Label>Manual progress %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        progress: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                      }))
                    }
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn(
                      "h-8 w-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-background",
                      c,
                      form.color === c ? "ring-teal-500" : "ring-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFormOpen(false)} className="cursor-pointer">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-500 hover:bg-teal-600 text-white cursor-pointer"
              >
                {saving ? "Saving…" : "Save goal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showSkeleton ? (
        <GoalsSkeleton />
      ) : enriched.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No goals yet. Add one to track progress toward a deadline.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enriched.map((goal) => {
            const days = daysUntil(goal.deadline);
            const overdue = days !== null && days < 0;
            return (
              <Card key={goal.id} className="rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      {goal.description && (
                        <CardDescription className="text-xs mt-1">{goal.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(goal)}
                        className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGoal(goal.id)}
                        className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{goal.target}</span>
                    <span className="font-bold">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn(goal.color, "h-2 rounded-full transition-all")}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {goal.metric && goal.metric !== "custom" && (
                      <span>
                        Current: {goal.current_value ?? 0}
                        {goal.unit ? ` ${goal.unit}` : ""}
                      </span>
                    )}
                    {days !== null && (
                      <span className={cn(overdue && "text-rose-600 font-semibold")}>
                        {overdue
                          ? `Overdue by ${Math.abs(days)} days`
                          : days === 0
                            ? "Due today"
                            : `${days} days remaining`}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
