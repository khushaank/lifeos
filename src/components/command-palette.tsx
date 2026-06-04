"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Timer,
  Scale,
  BrainCircuit,
  Briefcase,
  Dumbbell,
  Target,
  Film,
  Store,
  Search,
  Plus,
} from "lucide-react";

type SearchItem = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PAGES: SearchItem[] = [
  { id: "p-home", label: "Dashboard", href: "/", group: "Pages", icon: LayoutDashboard },
  { id: "p-checkin", label: "Check In", href: "/check-in", group: "Pages", icon: CheckSquare },
  { id: "p-planner", label: "Planner", href: "/planner", group: "Pages", icon: CalendarDays },
  { id: "p-focus", label: "Focus Timer", href: "/focus", group: "Pages", icon: Timer },
  { id: "p-journal", label: "Decision Journal", href: "/journal", group: "Pages", icon: Scale },
  { id: "p-opportunities", label: "Missed Opportunities", href: "/opportunities", group: "Pages", icon: Target },
  { id: "p-movies", label: "Movies", href: "/movies", group: "Pages", icon: Film },
  { id: "p-workout", label: "Workout Timeline", href: "/workout", group: "Pages", icon: Dumbbell },
  { id: "p-insights", label: "Insights & Heatmaps", href: "/insights", group: "Pages", icon: BrainCircuit },
  { id: "p-goals", label: "Goals", href: "/goals", group: "Pages", icon: Target },
  { id: "p-kpi", label: "Personal KPI (CEO)", href: "/kpi", group: "Pages", icon: Briefcase },
  {
    id: "p-experiments",
    label: "Life Experiments Store",
    href: "/experiments",
    group: "Pages",
    icon: Store,
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const entries = useLifeStore((s) => s.entries);
  const tasks = useLifeStore((s) => s.tasks);
  const decisions = useLifeStore((s) => s.decisions);
  const opportunities = useLifeStore((s) => s.opportunities);
  const movies = useLifeStore((s) => s.movies);

  const today = new Date().toISOString().split("T")[0];

  const allItems = useMemo(() => {
    const dynamic: SearchItem[] = [
      {
        id: "a-checkin-today",
        label: "Log today's check-in",
        href: `/check-in?date=${today}`,
        group: "Actions",
        icon: Plus,
      },
      ...entries.slice(0, 20).map((e) => ({
        id: `e-${e.date}`,
        label: `Check-in ${e.date}`,
        sublabel: `${e.mood_label} · Score ${e.life_score}`,
        href: `/check-in?date=${e.date}`,
        group: "Check-ins",
        icon: CheckSquare,
      })),
      ...tasks.filter((t) => t.status !== "Done").slice(0, 15).map((t) => ({
        id: `t-${t.id}`,
        label: t.title,
        sublabel: `${t.due_date} · ${t.priority}`,
        href: "/planner",
        group: "Tasks",
        icon: CalendarDays,
      })),
      ...decisions.slice(0, 15).map((d) => ({
        id: `d-${d.id}`,
        label: d.title,
        sublabel: d.decision_made.slice(0, 60),
        href: "/journal",
        group: "Decisions",
        icon: Scale,
      })),
      ...opportunities.slice(0, 15).map((o) => ({
        id: `o-${o.id}`,
        label: o.title,
        sublabel: o.opportunity_date,
        href: "/opportunities",
        group: "Missed opportunities",
        icon: Target,
      })),
      ...movies.slice(0, 15).map((m) => ({
        id: `m-${m.id}`,
        label: m.title,
        sublabel: `★ ${m.rating}/10`,
        href: "/movies",
        group: "Movies",
        icon: Film,
      })),
    ];
    return [...PAGES, ...dynamic];
  }, [entries, tasks, decisions, opportunities, movies, today]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 12);
    return allItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.sublabel?.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [allItems, query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setActiveIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => {
      setOpen(true);
      setActiveIndex(0);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("lifeos:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("lifeos:open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[activeIndex]) {
        e.preventDefault();
        go(filtered[activeIndex].href);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, activeIndex, go]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const grouped = filtered.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close search"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, check-ins, tasks, journal..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No results</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  {group}
                </p>
                {items.map((item) => {
                  flatIndex += 1;
                  const idx = flatIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm cursor-pointer transition-colors",
                        idx === activeIndex ? "bg-teal-50 dark:bg-teal-950/40" : "hover:bg-muted/60"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground flex gap-3">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto font-mono">Ctrl K</span>
        </div>
      </div>
    </div>
  );
}

/** Floating hint — default search entry point */
export function CommandPaletteTrigger() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("lifeos:open-search"))}
      className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search</span>
      <kbd className="font-mono text-[10px] border border-border rounded px-1">Ctrl K</kbd>
    </button>
  );
}
