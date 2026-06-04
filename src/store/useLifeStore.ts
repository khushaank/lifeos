import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  payloadFromClient,
  todayDateString,
  type FocusTimerClientState,
  type FocusTimerPayload,
} from "@/lib/focus-timer";
import { SYNC_STALE_MS } from "@/lib/sync-cache";
import { getTemplate, EXPERIMENT_DURATION_DAYS } from "@/lib/experiment-catalog";
import { addDays, todayString as experimentToday } from "@/lib/experiments";

export interface LogEntry {
  id?: string;
  date: string;
  mood_label: string;
  mood_score: number;
  bedtime?: string;
  wake_time?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  energy_level?: number;
  focus_level?: number;
  productivity_level?: number;
  stress_level?: number;
  water_intake?: number;
  junk_food?: boolean;
  social_interaction?: number;
  notes?: string;
  wins?: string;
  challenges?: string;
  life_score: number;
  workout_done?: boolean;
  exercise_duration?: number;
  workout_type?: string;
  pages_read?: number;
  book_name?: string;
  study_hours?: number;
  study_topic?: string;
}

export interface LifeTask {
  id: string;
  title: string;
  due_date: string;
  due_time?: string;
  notes?: string;
  priority: "Low" | "Medium" | "High";
  status: "Todo" | "Doing" | "Done";
  area: "Health" | "Work" | "Learning" | "Personal";
  google_event_id?: string;
  google_task_id?: string;
  google_synced_at?: string;
}

export type GoalMetric =
  | "custom"
  | "study_hours_weekly"
  | "study_hours_daily"
  | "sleep_hours_avg"
  | "water_daily"
  | "workouts_weekly"
  | "checkins_monthly"
  | "pages_read_weekly";

export interface LifeGoal {
  id: string;
  title: string;
  target: string;
  progress: number;
  color: string;
  deadline?: string | null;
  description?: string;
  metric?: GoalMetric;
  target_value?: number | null;
  current_value?: number | null;
  unit?: string;
}

export interface DecisionEntry {
  id: string;
  decision_date: string;
  title: string;
  situation: string;
  options_considered: string;
  decision_made: string;
  reasoning: string;
  expected_outcome: string;
  actual_outcome: string;
  confidence: number;
  outcome_rating: number | null;
  tags: string;
  created_at?: string;
  updated_at?: string;
}

export interface MissedOpportunity {
  id: string;
  opportunity_date: string;
  title: string;
  description: string;
  why_missed: string;
  lesson_learned: string;
  regret_level: number;
  tags: string;
  created_at?: string;
  updated_at?: string;
}

export interface MovieEntry {
  id: string;
  watched_date: string;
  title: string;
  rating: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export type ExperimentTrackType =
  | "youtube"
  | "study"
  | "workout"
  | "reading"
  | "custom";

export interface ActiveExperiment {
  id: string;
  template_id: string;
  title: string;
  description: string;
  track_type: ExperimentTrackType;
  daily_prompt: string;
  started_at: string;
  ends_at: string;
  notify_enabled: boolean;
  notify_hour: number;
  responses: Record<string, boolean>;
}

export interface LifeOSExport {
  entries: LogEntry[];
  tasks: LifeTask[];
  goals: LifeGoal[];
  decisions?: DecisionEntry[];
  opportunities?: MissedOpportunity[];
  movies?: MovieEntry[];
  experiments?: ActiveExperiment[];
  exportedAt: string;
}

const defaultFocusTimer = (): FocusTimerClientState => ({
  selectedMinutes: 25,
  status: "idle",
  endsAt: null,
  remainingSeconds: 25 * 60,
  sessionsCompletedDate: todayDateString(),
  sessionsCompletedCount: 0,
});

interface LifeStore {
  entries: LogEntry[];
  tasks: LifeTask[];
  goals: LifeGoal[];
  decisions: DecisionEntry[];
  opportunities: MissedOpportunity[];
  movies: MovieEntry[];
  experiments: ActiveExperiment[];
  focusTimer: FocusTimerClientState;
  isAuthenticated: boolean;
  isSyncing: boolean;
  isSyncingTimer: boolean;
  isSidebarCollapsed: boolean;
  lastSyncedAt: number | null;
  error: string | null;
  syncAll: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  setAuthenticated: (auth: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  fetchFocusTimer: () => Promise<void>;
  saveFocusTimer: (state: FocusTimerClientState) => Promise<boolean>;
  setFocusTimerLocal: (patch: Partial<FocusTimerClientState>) => void;
  fetchEntries: () => Promise<void>;
  addOrUpdateEntry: (entry: LogEntry) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
  addTask: (task: Omit<LifeTask, "id">) => Promise<void>;
  updateTask: (id: string, updates: Partial<LifeTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addGoal: (goal: Omit<LifeGoal, "id">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<LifeGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  fetchDecisions: () => Promise<void>;
  saveDecision: (decision: DecisionEntry) => Promise<boolean>;
  deleteDecision: (id: string) => Promise<boolean>;
  fetchOpportunities: () => Promise<void>;
  saveOpportunity: (item: MissedOpportunity) => Promise<boolean>;
  deleteOpportunity: (id: string) => Promise<boolean>;
  fetchMovies: () => Promise<void>;
  saveMovie: (item: MovieEntry) => Promise<boolean>;
  deleteMovie: (id: string) => Promise<boolean>;
  fetchExperiments: () => Promise<void>;
  installExperiment: (params: {
    templateId: string;
    title?: string;
    description?: string;
    dailyPrompt?: string;
    notifyEnabled?: boolean;
    notifyHour?: number;
  }) => Promise<boolean>;
  recordExperimentResponse: (id: string, date: string, done: boolean) => Promise<boolean>;
  updateExperiment: (id: string, updates: Partial<ActiveExperiment>) => Promise<boolean>;
  removeExperiment: (id: string) => Promise<boolean>;
  importData: (data: Partial<LifeOSExport>) => void;
  exportData: () => LifeOSExport;
  clearAllData: () => void;
}

const defaultGoals: LifeGoal[] = [
  {
    id: "sleep",
    title: "Sleep Duration",
    target: "8 hrs avg",
    progress: 0,
    color: "bg-sky-500",
    metric: "sleep_hours_avg",
    target_value: 8,
    unit: "hrs",
  },
  {
    id: "water",
    title: "Water Intake",
    target: "3,000 ml today",
    progress: 0,
    color: "bg-teal-500",
    metric: "water_daily",
    target_value: 3000,
    unit: "ml",
  },
  {
    id: "workouts",
    title: "Weekly Workouts",
    target: "5 days / week",
    progress: 0,
    color: "bg-emerald-500",
    metric: "workouts_weekly",
    target_value: 5,
    unit: "days",
  },
  {
    id: "study",
    title: "Study Goal",
    target: "2 hrs / day",
    progress: 0,
    color: "bg-violet-500",
    metric: "study_hours_daily",
    target_value: 2,
    unit: "hrs",
  },
];

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const useLifeStore = create<LifeStore>()(
  persist(
    (set, get) => ({
      entries: [],
      tasks: [],
      goals: defaultGoals,
      decisions: [],
      opportunities: [],
      movies: [],
      experiments: [],
      focusTimer: defaultFocusTimer(),
      isAuthenticated: false,
      isSyncing: false,
      isSyncingTimer: false,
      isSidebarCollapsed: false,
      lastSyncedAt: null,
      error: null,

      syncAll: async (options = {}) => {
        const { force = false, silent = false } = options;
        const last = get().lastSyncedAt;
        if (!force && last && Date.now() - last < SYNC_STALE_MS) {
          return;
        }

        if (!silent) set({ isSyncing: true, error: null });

        try {
          const deRes = await fetch("/api/entries");
          if (deRes.ok) {
            set({ entries: await deRes.json() });
          } else if (deRes.status === 401) {
            set({ isAuthenticated: false });
            return;
          }

          const [tkRes, glRes, decRes, oppRes, movRes, expRes] = await Promise.all([
            fetch("/api/tasks"),
            fetch("/api/goals"),
            fetch("/api/decisions"),
            fetch("/api/opportunities"),
            fetch("/api/movies"),
            fetch("/api/experiments"),
          ]);

          if (tkRes.ok) set({ tasks: await tkRes.json() });
          if (decRes.ok) set({ decisions: await decRes.json() });
          if (expRes.ok) {
            const exps = await expRes.json();
            const today = todayDateString();
            set({ experiments: Array.isArray(exps) ? exps.filter((e: ActiveExperiment) => e.ends_at >= today) : [] });
          }
          if (oppRes.ok) set({ opportunities: await oppRes.json() });
          if (movRes.ok) set({ movies: await movRes.json() });

          if (glRes.ok) {
            const glData = await glRes.json();
            if (glData && glData.length > 0) {
              set({ goals: glData });
            } else if (force) {
              const seededGoals = [];
              for (const g of defaultGoals) {
                const seedRes = await fetch("/api/goals", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(g),
                });
                if (seedRes.ok) seededGoals.push(g);
              }
              if (seededGoals.length > 0) set({ goals: seededGoals });
            }
          }

          set({ lastSyncedAt: Date.now() });
        } catch (err) {
          console.error("syncAll error:", err);
          if (!silent) set({ error: "Failed to sync with cloud vault." });
        } finally {
          if (!silent) set({ isSyncing: false });
        }
      },

      setAuthenticated: (auth) => {
        set({ isAuthenticated: auth });
        if (!auth) {
          fetch("/api/auth/logout", { method: "POST" }).catch((err) =>
            console.error("Logout API call failed:", err)
          );
        }
      },

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      setFocusTimerLocal: (patch) =>
        set((state) => ({
          focusTimer: { ...state.focusTimer, ...patch },
        })),

      fetchFocusTimer: async () => {
        set({ isSyncingTimer: true });
        try {
          const res = await fetch("/api/focus-timer");
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return;
          }
          const data = (await res.json()) as FocusTimerClientState;
          set({ focusTimer: data });
        } catch (err) {
          console.error("Fetch focus timer error:", err);
        } finally {
          set({ isSyncingTimer: false });
        }
      },

      saveFocusTimer: async (timerState) => {
        set({ focusTimer: timerState, isSyncingTimer: true });
        try {
          const payload: FocusTimerPayload = payloadFromClient(timerState);
          const res = await fetch("/api/focus-timer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          const data = (await res.json()) as FocusTimerClientState;
          set({ focusTimer: data });
          return true;
        } catch (err) {
          console.error("Save focus timer error:", err);
          return false;
        } finally {
          set({ isSyncingTimer: false });
        }
      },

      fetchEntries: async () => {
        await get().syncAll({ force: true, silent: false });
      },

      addOrUpdateEntry: async (newEntry) => {
        try {
          const res = await fetch("/api/entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEntry),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to save entry");
          }

          const currentEntries = get().entries;
          const index = currentEntries.findIndex((entry) => entry.date === newEntry.date);
          const updatedEntries = [...currentEntries];

          if (index > -1) {
            updatedEntries[index] = newEntry;
          } else {
            updatedEntries.push(newEntry);
          }

          updatedEntries.sort((a, b) => b.date.localeCompare(a.date));
          set({ entries: updatedEntries });
          return true;
        } catch (err) {
          console.error("Save entry sync error:", err);
          return false;
        }
      },

      deleteEntry: async (date) => {
        try {
          const res = await fetch(`/api/entries?date=${date}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to delete entry");
          }

          set({ entries: get().entries.filter((entry) => entry.date !== date) });
          return true;
        } catch (err) {
          console.error("Delete entry sync error:", err);
          return false;
        }
      },

      addTask: async (task) => {
        const id = makeId();
        const newTask = { ...task, id };
        try {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to add task");
          }
          set({ tasks: [newTask, ...get().tasks] });
        } catch (err) {
          console.error("Add task sync error:", err);
        }
      },

      updateTask: async (id, updates) => {
        const existingTask = get().tasks.find((task) => task.id === id);
        if (!existingTask) return;
        const updatedTask = { ...existingTask, ...updates };

        try {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to update task");
          }
          set({ tasks: get().tasks.map((task) => (task.id === id ? updatedTask : task)) });
        } catch (err) {
          console.error("Update task sync error:", err);
        }
      },

      deleteTask: async (id) => {
        try {
          const res = await fetch(`/api/tasks?id=${id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to delete task");
          }
          set({ tasks: get().tasks.filter((task) => task.id !== id) });
        } catch (err) {
          console.error("Delete task sync error:", err);
        }
      },

      addGoal: async (goal) => {
        const id = makeId();
        const newGoal = { ...goal, id };
        try {
          const res = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newGoal),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to add goal");
          }
          set({ goals: [...get().goals, newGoal] });
        } catch (err) {
          console.error("Add goal sync error:", err);
        }
      },

      updateGoal: async (id, updates) => {
        const existingGoal = get().goals.find((goal) => goal.id === id);
        if (!existingGoal) return;
        const updatedGoal = { ...existingGoal, ...updates };

        try {
          const res = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedGoal),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to update goal");
          }
          set({ goals: get().goals.map((goal) => (goal.id === id ? updatedGoal : goal)) });
        } catch (err) {
          console.error("Update goal sync error:", err);
        }
      },

      deleteGoal: async (id) => {
        try {
          const res = await fetch(`/api/goals?id=${id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            throw new Error("Failed to delete goal");
          }
          set({ goals: get().goals.filter((goal) => goal.id !== id) });
        } catch (err) {
          console.error("Delete goal sync error:", err);
        }
      },

      fetchDecisions: async () => {
        try {
          const res = await fetch("/api/decisions");
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return;
          }
          const data = await res.json();
          set({ decisions: data });
        } catch (err) {
          console.error("Fetch decisions error:", err);
        }
      },

      saveDecision: async (decision) => {
        try {
          const res = await fetch("/api/decisions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(decision),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          const list = get().decisions;
          const idx = list.findIndex((d) => d.id === decision.id);
          const next = [...list];
          if (idx > -1) next[idx] = decision;
          else next.unshift(decision);
          next.sort((a, b) => b.decision_date.localeCompare(a.decision_date));
          set({ decisions: next });
          return true;
        } catch (err) {
          console.error("Save decision error:", err);
          return false;
        }
      },

      deleteDecision: async (id) => {
        try {
          const res = await fetch(`/api/decisions?id=${id}`, { method: "DELETE" });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          set({ decisions: get().decisions.filter((d) => d.id !== id) });
          return true;
        } catch (err) {
          console.error("Delete decision error:", err);
          return false;
        }
      },

      fetchOpportunities: async () => {
        try {
          const res = await fetch("/api/opportunities");
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return;
          }
          set({ opportunities: await res.json() });
        } catch (err) {
          console.error("Fetch opportunities error:", err);
        }
      },

      saveOpportunity: async (item) => {
        try {
          const res = await fetch("/api/opportunities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          const list = get().opportunities;
          const idx = list.findIndex((o) => o.id === item.id);
          const next = [...list];
          if (idx > -1) next[idx] = item;
          else next.unshift(item);
          next.sort((a, b) => b.opportunity_date.localeCompare(a.opportunity_date));
          set({ opportunities: next });
          return true;
        } catch (err) {
          console.error("Save opportunity error:", err);
          return false;
        }
      },

      deleteOpportunity: async (id) => {
        try {
          const res = await fetch(`/api/opportunities?id=${id}`, { method: "DELETE" });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          set({ opportunities: get().opportunities.filter((o) => o.id !== id) });
          return true;
        } catch (err) {
          console.error("Delete opportunity error:", err);
          return false;
        }
      },

      fetchMovies: async () => {
        try {
          const res = await fetch("/api/movies");
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return;
          }
          set({ movies: await res.json() });
        } catch (err) {
          console.error("Fetch movies error:", err);
        }
      },

      saveMovie: async (item) => {
        try {
          const res = await fetch("/api/movies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          const list = get().movies;
          const idx = list.findIndex((m) => m.id === item.id);
          const next = [...list];
          if (idx > -1) next[idx] = item;
          else next.push(item);
          next.sort((a, b) => b.rating - a.rating || b.watched_date.localeCompare(a.watched_date));
          set({ movies: next });
          return true;
        } catch (err) {
          console.error("Save movie error:", err);
          return false;
        }
      },

      deleteMovie: async (id) => {
        try {
          const res = await fetch(`/api/movies?id=${id}`, { method: "DELETE" });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          set({ movies: get().movies.filter((m) => m.id !== id) });
          return true;
        } catch (err) {
          console.error("Delete movie error:", err);
          return false;
        }
      },

      fetchExperiments: async () => {
        try {
          const res = await fetch("/api/experiments");
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return;
          }
          const text = await res.text();
          const data = text ? JSON.parse(text) : [];
          const today = todayDateString();
          set({
            experiments: Array.isArray(data)
              ? data.filter((e: ActiveExperiment) => e.ends_at >= today)
              : [],
          });
        } catch (err) {
          console.error("Fetch experiments error:", err);
          set({ experiments: [] });
        }
      },

      installExperiment: async (params) => {
        const template = getTemplate(params.templateId);
        if (!template) return false;

        const activeSame = get().experiments.find((e) => e.template_id === params.templateId);
        if (activeSame) return false;

        const started = experimentToday();
        const exp: ActiveExperiment = {
          id: makeId(),
          template_id: params.templateId,
          title: params.title?.trim() || template.name,
          description: params.description?.trim() || template.description,
          track_type: template.trackType,
          daily_prompt: params.dailyPrompt?.trim() || template.dailyPrompt,
          started_at: started,
          ends_at: addDays(started, EXPERIMENT_DURATION_DAYS - 1),
          notify_enabled: params.notifyEnabled ?? true,
          notify_hour: params.notifyHour ?? 20,
          responses: {},
        };

        try {
          const res = await fetch("/api/experiments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(exp),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          set({ experiments: [...get().experiments, exp] });
          return true;
        } catch (err) {
          console.error("Install experiment error:", err);
          return false;
        }
      },

      recordExperimentResponse: async (id, date, done) => {
        const existing = get().experiments.find((e) => e.id === id);
        if (!existing) return false;
        const updated: ActiveExperiment = {
          ...existing,
          responses: { ...existing.responses, [date]: done },
        };
        try {
          const res = await fetch("/api/experiments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          set({
            experiments: get().experiments.map((e) => (e.id === id ? updated : e)),
          });
          return true;
        } catch (err) {
          console.error("Record experiment error:", err);
          return false;
        }
      },

      updateExperiment: async (id, updates) => {
        const existing = get().experiments.find((e) => e.id === id);
        if (!existing) return false;
        const updated = { ...existing, ...updates };
        try {
          const res = await fetch("/api/experiments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          set({
            experiments: get().experiments.map((e) => (e.id === id ? updated : e)),
          });
          return true;
        } catch (err) {
          console.error("Update experiment error:", err);
          return false;
        }
      },

      removeExperiment: async (id) => {
        try {
          const res = await fetch(`/api/experiments?id=${id}`, { method: "DELETE" });
          if (!res.ok) {
            if (res.status === 401) set({ isAuthenticated: false });
            return false;
          }
          set({ experiments: get().experiments.filter((e) => e.id !== id) });
          return true;
        } catch (err) {
          console.error("Remove experiment error:", err);
          return false;
        }
      },

      importData: (data) => {
        set({
          entries: Array.isArray(data.entries) ? data.entries : get().entries,
          tasks: Array.isArray(data.tasks) ? data.tasks : get().tasks,
          goals: Array.isArray(data.goals) ? data.goals : get().goals,
          decisions: Array.isArray(data.decisions) ? data.decisions : get().decisions,
          opportunities: Array.isArray(data.opportunities) ? data.opportunities : get().opportunities,
          movies: Array.isArray(data.movies) ? data.movies : get().movies,
          experiments: Array.isArray(data.experiments) ? data.experiments : get().experiments,
        });
      },

      exportData: () => ({
        entries: get().entries,
        tasks: get().tasks,
        goals: get().goals,
        decisions: get().decisions,
        opportunities: get().opportunities,
        movies: get().movies,
        experiments: get().experiments,
        exportedAt: new Date().toISOString(),
      }),

      clearAllData: () => {
        set({
          entries: [],
          tasks: [],
          goals: defaultGoals,
          decisions: [],
          opportunities: [],
          movies: [],
          experiments: [],
        });
      },
    }),
    {
      name: "lifeos-storage",
      partialize: (state) => ({
        entries: state.entries,
        tasks: state.tasks,
        goals: state.goals,
        decisions: state.decisions,
        opportunities: state.opportunities,
        movies: state.movies,
        experiments: state.experiments,
        focusTimer: state.focusTimer,
        isAuthenticated: state.isAuthenticated,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
