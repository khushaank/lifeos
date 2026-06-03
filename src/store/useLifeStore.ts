import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export interface LifeGoal {
  id: string;
  title: string;
  target: string;
  progress: number;
  color: string;
}

export interface LifeOSExport {
  entries: LogEntry[];
  tasks: LifeTask[];
  goals: LifeGoal[];
  exportedAt: string;
}

interface LifeStore {
  entries: LogEntry[];
  tasks: LifeTask[];
  goals: LifeGoal[];
  isAuthenticated: boolean;
  isSyncing: boolean;
  isSidebarCollapsed: boolean;
  error: string | null;
  setAuthenticated: (auth: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  fetchEntries: () => Promise<void>;
  addOrUpdateEntry: (entry: LogEntry) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
  addTask: (task: Omit<LifeTask, "id">) => Promise<void>;
  updateTask: (id: string, updates: Partial<LifeTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addGoal: (goal: Omit<LifeGoal, "id">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<LifeGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  importData: (data: Partial<LifeOSExport>) => void;
  exportData: () => LifeOSExport;
  clearAllData: () => void;
}

const defaultGoals: LifeGoal[] = [
  { id: "sleep", title: "Sleep Duration", target: "8.0 hrs", progress: 72, color: "bg-sky-500" },
  { id: "water", title: "Water Intake", target: "3,000 ml", progress: 66, color: "bg-teal-500" },
  { id: "workouts", title: "Weekly Workouts", target: "5 days", progress: 60, color: "bg-emerald-500" },
  { id: "study", title: "Study Goal", target: "2 hrs / day", progress: 55, color: "bg-violet-500" },
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
      isAuthenticated: false,
      isSyncing: false,
      isSidebarCollapsed: false,
      error: null,

      setAuthenticated: (auth) => {
        set({ isAuthenticated: auth });
        if (!auth) {
          fetch("/api/auth/logout", { method: "POST" }).catch((err) =>
            console.error("Logout API call failed:", err)
          );
        }
      },

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      fetchEntries: async () => {
        set({ isSyncing: true, error: null });
        try {
          // Fetch entries
          const deRes = await fetch("/api/entries");
          if (deRes.ok) {
            const deData = await deRes.json();
            set({ entries: deData });
          } else if (deRes.status === 401) {
            set({ isAuthenticated: false });
          }

          // Fetch tasks
          const tkRes = await fetch("/api/tasks");
          if (tkRes.ok) {
            const tkData = await tkRes.json();
            set({ tasks: tkData });
          }

          // Fetch goals
          const glRes = await fetch("/api/goals");
          if (glRes.ok) {
            const glData = await glRes.json();
            if (glData && glData.length > 0) {
              set({ goals: glData });
            } else {
              // Seed default goals if database is empty
              const seededGoals = [];
              for (const g of defaultGoals) {
                const seedRes = await fetch("/api/goals", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(g),
                });
                if (seedRes.ok) {
                  seededGoals.push(g);
                }
              }
              if (seededGoals.length > 0) {
                set({ goals: seededGoals });
              }
            }
          }
        } catch (err) {
          console.error("Fetch entries sync error:", err);
          set({ error: "Failed to sync with cloud vault." });
        } finally {
          set({ isSyncing: false });
        }
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

      importData: (data) => {
        set({
          entries: Array.isArray(data.entries) ? data.entries : get().entries,
          tasks: Array.isArray(data.tasks) ? data.tasks : get().tasks,
          goals: Array.isArray(data.goals) ? data.goals : get().goals,
        });
      },

      exportData: () => ({
        entries: get().entries,
        tasks: get().tasks,
        goals: get().goals,
        exportedAt: new Date().toISOString(),
      }),

      clearAllData: () => {
        set({ entries: [], tasks: [], goals: defaultGoals });
      },
    }),
    {
      name: "lifeos-storage",
      partialize: (state) => ({
        entries: state.entries,
        tasks: state.tasks,
        goals: state.goals,
        isAuthenticated: state.isAuthenticated,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
