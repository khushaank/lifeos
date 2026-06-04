"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { useLifeStore, type MovieEntry } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Film, Plus, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const empty = (): MovieEntry => ({
  id: "",
  watched_date: todayString(),
  title: "",
  rating: 8,
  notes: "",
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      <Star className="h-4 w-4 fill-current" />
      <span className="text-sm font-bold">{rating}/10</span>
    </span>
  );
}

export default function MoviesPage() {
  const movies = useLifeStore((s) => s.movies);
  const saveMovie = useLifeStore((s) => s.saveMovie);
  const deleteMovie = useLifeStore((s) => s.deleteMovie);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  const best = movies[0] ?? null;
  const rest = movies.slice(1);

  const avgRating = useMemo(() => {
    if (!movies.length) return 0;
    return movies.reduce((s, m) => s + m.rating, 0) / movies.length;
  }, [movies]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const ok = await saveMovie({
      ...form,
      id: editingId || makeId(),
      title: form.title.trim(),
      rating: Math.min(10, Math.max(1, form.rating)),
    });
    setSaving(false);
    if (ok) {
      setFormOpen(false);
      setForm(empty());
      setEditingId(null);
    }
  };

  return (
    <PageShell maxWidth="3xl" mainClassName="space-y-6">
      <div className="rounded-2xl border border-border bg-card px-4 py-5 sm:px-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Movies</h1>
              <p className="text-sm text-muted-foreground">
                Track what you have seen and your personal ratings.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setForm(empty());
              setFormOpen(true);
            }}
            className="bg-teal-500 hover:bg-teal-600 text-white w-full sm:w-auto cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add movie
          </Button>
        </div>
      </div>

      {best && (
        <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50 via-card to-card dark:from-amber-950/30 dark:border-amber-900/50 rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
              Best movie so far
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{best.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Watched {new Date(`${best.watched_date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                {best.notes && <p className="text-sm mt-2 text-muted-foreground">{best.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Stars rating={best.rating} />
                {movies.length > 1 && (
                  <span className="text-xs text-muted-foreground">· {movies.length} total</span>
                )}
              </div>
            </div>
            {movies.length > 1 && (
              <p className="text-xs text-muted-foreground mt-4">
                Average rating across all films: {avgRating.toFixed(1)}/10
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {formOpen && (
        <Card className="border-border rounded-2xl">
          <CardHeader className="flex flex-row justify-between">
            <CardTitle className="text-base">{editingId ? "Edit movie" : "Add movie"}</CardTitle>
            <button type="button" onClick={() => setFormOpen(false)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Watched date</Label>
                  <Input type="date" value={form.watched_date} onChange={(e) => setForm({ ...form, watched_date: e.target.value })} className="bg-muted/40 border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Rating (1–10)</Label>
                  <Input type="number" min={1} max={10} value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 1 })} className="bg-muted/40 border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-muted/40 border-border" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-muted/40 border-border resize-none h-20" />
              </div>
              <Button type="submit" disabled={saving} className="bg-teal-500 hover:bg-teal-600 text-white cursor-pointer">
                {saving ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {movies.length === 0 ? (
        <Card className="border-border rounded-2xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">No movies logged yet.</CardContent>
        </Card>
      ) : rest.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold px-1">All films (by rating)</h3>
          {rest.map((m, i) => (
            <Card key={m.id} className={cn("border-border rounded-xl", i === 0 && !best && "")}>
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.watched_date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Stars rating={m.rating} />
                  <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => { setEditingId(m.id); setForm({ ...m }); setFormOpen(true); }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-rose-600 cursor-pointer" onClick={() => deleteMovie(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
