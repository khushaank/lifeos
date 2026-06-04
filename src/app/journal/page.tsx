"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { useLifeStore, type DecisionEntry } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Scale, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

const emptyForm = (): Omit<DecisionEntry, "id"> & { id?: string } => ({
  decision_date: todayString(),
  title: "",
  situation: "",
  options_considered: "",
  decision_made: "",
  reasoning: "",
  expected_outcome: "",
  actual_outcome: "",
  confidence: 7,
  outcome_rating: null,
  tags: "",
});

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function JournalPage() {
  const decisions = useLifeStore((s) => s.decisions);
  const saveDecision = useLifeStore((s) => s.saveDecision);
  const deleteDecision = useLifeStore((s) => s.deleteDecision);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");


  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return decisions;
    return decisions.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.decision_made.toLowerCase().includes(q) ||
        d.tags.toLowerCase().includes(q)
    );
  }, [decisions, filter]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (entry: DecisionEntry) => {
    setEditingId(entry.id);
    setForm({ ...entry });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.decision_made.trim()) return;
    setSaving(true);
    const payload: DecisionEntry = {
      ...form,
      id: editingId || makeId(),
      title: form.title.trim(),
      decision_made: form.decision_made.trim(),
    };
    const ok = await saveDecision(payload);
    setSaving(false);
    if (ok) {
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this journal entry?")) return;
    await deleteDecision(id);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <PageShell maxWidth="3xl" mainClassName="space-y-6">
      <div className="space-y-3">
        <div className="flex justify-start">
          <Button onClick={openNew} className="bg-teal-500 hover:bg-teal-600 text-white w-full sm:w-auto cursor-pointer shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            New decision
          </Button>
        </div>
        <Input
          placeholder="Search decisions..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-muted/40 border-border"
        />
      </div>

      {formOpen && (
        <Card className="border-border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base">{editingId ? "Edit decision" : "Log a decision"}</CardTitle>
              <CardDescription className="text-xs">Capture context before memory fades.</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.decision_date}
                    onChange={(e) => setForm({ ...form, decision_date: e.target.value })}
                    className="bg-muted/40 border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confidence (1–10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.confidence}
                    onChange={(e) => setForm({ ...form, confidence: parseInt(e.target.value) || 5 })}
                    className="bg-muted/40 border-border"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Accept new project offer"
                  className="bg-muted/40 border-border"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Situation</Label>
                <Textarea
                  value={form.situation}
                  onChange={(e) => setForm({ ...form, situation: e.target.value })}
                  placeholder="What was happening? What was at stake?"
                  className="bg-muted/40 border-border resize-none h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Options considered</Label>
                <Textarea
                  value={form.options_considered}
                  onChange={(e) => setForm({ ...form, options_considered: e.target.value })}
                  placeholder="List alternatives you weighed..."
                  className="bg-muted/40 border-border resize-none h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Decision made</Label>
                <Textarea
                  value={form.decision_made}
                  onChange={(e) => setForm({ ...form, decision_made: e.target.value })}
                  placeholder="What did you choose?"
                  className="bg-muted/40 border-border resize-none h-16"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reasoning</Label>
                <Textarea
                  value={form.reasoning}
                  onChange={(e) => setForm({ ...form, reasoning: e.target.value })}
                  placeholder="Why this path?"
                  className="bg-muted/40 border-border resize-none h-20"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Expected outcome</Label>
                  <Textarea
                    value={form.expected_outcome}
                    onChange={(e) => setForm({ ...form, expected_outcome: e.target.value })}
                    className="bg-muted/40 border-border resize-none h-16"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Actual outcome (review later)</Label>
                  <Textarea
                    value={form.actual_outcome}
                    onChange={(e) => setForm({ ...form, actual_outcome: e.target.value })}
                    className="bg-muted/40 border-border resize-none h-16"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Outcome rating (1–10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.outcome_rating ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        outcome_rating: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="bg-muted/40 border-border"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="work, health, money"
                    className="bg-muted/40 border-border"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white cursor-pointer"
              >
                {saving ? "Saving..." : editingId ? "Update entry" : "Save decision"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="border-border rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            <Scale className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-foreground">No decisions logged yet</p>
            <p className="mt-1 text-xs">Start building a record of how you decide.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className="border-border rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  className="w-full text-left px-4 py-4 sm:px-5 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base truncate">{entry.title}</h3>
                      <span className="text-[10px] font-bold rounded-full bg-teal-50 text-teal-700 px-2 py-0.5 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800">
                        {entry.confidence}/10 confidence
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(`${entry.decision_date}T12:00:00`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {entry.tags ? ` · ${entry.tags}` : ""}
                    </p>
                    <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">{entry.decision_made}</p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {expanded && (
                  <CardContent className="pt-0 pb-4 px-4 sm:px-5 space-y-3 border-t border-border">
                    {entry.situation && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Situation</p>
                        <p className="text-sm mt-0.5">{entry.situation}</p>
                      </div>
                    )}
                    {entry.options_considered && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Options</p>
                        <p className="text-sm mt-0.5 whitespace-pre-wrap">{entry.options_considered}</p>
                      </div>
                    )}
                    {entry.reasoning && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Reasoning</p>
                        <p className="text-sm mt-0.5">{entry.reasoning}</p>
                      </div>
                    )}
                    {(entry.expected_outcome || entry.actual_outcome) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {entry.expected_outcome && (
                          <div className="rounded-xl bg-muted/40 p-3">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Expected</p>
                            <p className="text-sm mt-0.5">{entry.expected_outcome}</p>
                          </div>
                        )}
                        {entry.actual_outcome && (
                          <div className="rounded-xl bg-muted/40 p-3">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Actual</p>
                            <p className="text-sm mt-0.5">{entry.actual_outcome}</p>
                            {entry.outcome_rating != null && (
                              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-semibold">
                                Rated {entry.outcome_rating}/10
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(entry)} className="cursor-pointer">
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(entry.id)}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer dark:border-rose-900/50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
