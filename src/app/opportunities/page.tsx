"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { useLifeStore, type MissedOpportunity } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, Trash2, X } from "lucide-react";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const empty = (): MissedOpportunity => ({
  id: "",
  opportunity_date: todayString(),
  title: "",
  description: "",
  why_missed: "",
  lesson_learned: "",
  regret_level: 5,
  tags: "",
});

export default function OpportunitiesPage() {
  const opportunities = useLifeStore((s) => s.opportunities);
  const saveOpportunity = useLifeStore((s) => s.saveOpportunity);
  const deleteOpportunity = useLifeStore((s) => s.deleteOpportunity);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty());
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return opportunities;
    return opportunities.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.tags.toLowerCase().includes(q)
    );
  }, [opportunities, filter]);

  const openNew = () => {
    setEditingId(null);
    setForm(empty());
    setFormOpen(true);
  };

  const openEdit = (o: MissedOpportunity) => {
    setEditingId(o.id);
    setForm({ ...o });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const ok = await saveOpportunity({ ...form, id: editingId || makeId(), title: form.title.trim() });
    setSaving(false);
    if (ok) {
      setFormOpen(false);
      setForm(empty());
    }
  };

  return (
    <PageShell maxWidth="3xl" mainClassName="space-y-6">
      <div className="space-y-3">
        <div className="flex justify-start">
          <div className="hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Missed Opportunity Log</h1>
              <p className="text-sm text-muted-foreground">
                Record chances you passed on — learn what to do differently next time.
              </p>
            </div>
          </div>
          <Button onClick={openNew} className="bg-teal-500 hover:bg-teal-600 text-white w-full sm:w-auto cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Log opportunity
          </Button>
        </div>
        <Input
          className="bg-muted/40 border-border"
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {formOpen && (
        <Card className="border-border rounded-2xl">
          <CardHeader className="flex flex-row justify-between">
            <CardTitle className="text-base">{editingId ? "Edit entry" : "New missed opportunity"}</CardTitle>
            <button type="button" onClick={() => setFormOpen(false)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.opportunity_date} onChange={(e) => setForm({ ...form, opportunity_date: e.target.value })} className="bg-muted/40 border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Regret level (1–10)</Label>
                  <Input type="number" min={1} max={10} value={form.regret_level} onChange={(e) => setForm({ ...form, regret_level: parseInt(e.target.value) || 5 })} className="bg-muted/40 border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>What was the opportunity?</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-muted/40 border-border" />
              </div>
              <div className="space-y-1.5">
                <Label>Context</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-muted/40 border-border resize-none h-20" />
              </div>
              <div className="space-y-1.5">
                <Label>Why did you miss it?</Label>
                <Textarea value={form.why_missed} onChange={(e) => setForm({ ...form, why_missed: e.target.value })} className="bg-muted/40 border-border resize-none h-20" />
              </div>
              <div className="space-y-1.5">
                <Label>Lesson for next time</Label>
                <Textarea value={form.lesson_learned} onChange={(e) => setForm({ ...form, lesson_learned: e.target.value })} className="bg-muted/40 border-border resize-none h-20" />
              </div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="career, money, health" className="bg-muted/40 border-border" />
              </div>
              <Button type="submit" disabled={saving} className="bg-teal-500 hover:bg-teal-600 text-white cursor-pointer">
                {saving ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="border-border rounded-2xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">No missed opportunities logged yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Card key={o.id} className="border-border rounded-2xl">
              <CardContent className="pt-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{o.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.opportunity_date}
                      {o.tags ? ` · ${o.tags}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-full w-fit">
                    Regret {o.regret_level}/10
                  </span>
                </div>
                {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
                {o.lesson_learned && (
                  <p className="text-sm border-l-2 border-teal-500 pl-3 text-teal-800 dark:text-teal-300">
                    {o.lesson_learned}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(o)} className="cursor-pointer">Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteOpportunity(o.id)} className="text-rose-600 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
