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
  error: string | null;
  setAuthenticated: (auth: boolean) => void;
  fetchEntries: () => Promise<void>;
  addOrUpdateEntry: (entry: LogEntry) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
  addTask: (task: Omit<LifeTask, "id">) => void;
  updateTask: (id: string, updates: Partial<LifeTask>) => void;
  deleteTask: (id: string) => void;
  addGoal: (goal: Omit<LifeGoal, "id">) => void;
  updateGoal: (id: string, updates: Partial<LifeGoal>) => void;
  deleteGoal: (id: string) => void;
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
      error: null,

      setAuthenticated: (auth) => set({ isAuthenticated: auth }),

      fetchEntries: async () => {
        set({ isSyncing: true, error: null });
        window.setTimeout(() => set({ isSyncing: false }), 250);
      },

      addOrUpdateEntry: async (newEntry) => {
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
      },

      deleteEntry: async (date) => {
        set({ entries: get().entries.filter((entry) => entry.date !== date) });
        return true;
      },

      addTask: (task) => {
        set({ tasks: [{ ...task, id: makeId() }, ...get().tasks] });
      },

      updateTask: (id, updates) => {
        set({ tasks: get().tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)) });
      },

      deleteTask: (id) => {
        set({ tasks: get().tasks.filter((task) => task.id !== id) });
      },

      addGoal: (goal) => {
        set({ goals: [...get().goals, { ...goal, id: makeId() }] });
      },

      updateGoal: (id, updates) => {
        set({ goals: get().goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)) });
      },

      deleteGoal: (id) => {
        set({ goals: get().goals.filter((goal) => goal.id !== id) });
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
      }),
    }
  )
);
