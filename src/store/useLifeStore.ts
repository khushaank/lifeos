import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateLifeScore } from "@/lib/formulas";

export interface LogEntry {
  id?: string;
  date: string;
  mood_label: string;
  mood_score: number; // 1-8
  bedtime?: string;
  wake_time?: string;
  sleep_hours?: number;
  sleep_quality?: number; // 1-10
  energy_level?: number; // 1-10
  focus_level?: number; // 1-10
  productivity_level?: number; // 1-10
  stress_level?: number; // 1-10
  water_intake?: number; // ml
  junk_food?: boolean;
  social_interaction?: number; // 1-10
  notes?: string;
  wins?: string;
  challenges?: string;
  life_score: number;
  
  // Sub-logs
  workout_done?: boolean;
  exercise_duration?: number;
  workout_type?: string;
  pages_read?: number;
  book_name?: string;
  study_hours?: number;
  study_topic?: string;
}

interface LifeStore {
  entries: LogEntry[];
  isAuthenticated: boolean;
  isSyncing: boolean;
  error: string | null;
  setAuthenticated: (auth: boolean) => void;
  fetchEntries: () => Promise<void>;
  addOrUpdateEntry: (entry: LogEntry) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
  generateMockData: () => void;
  clearAllData: () => void;
}

export const useLifeStore = create<LifeStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isAuthenticated: false,
      isSyncing: false,
      error: null,

      setAuthenticated: (auth) => set({ isAuthenticated: auth }),

      fetchEntries: async () => {
        set({ isSyncing: true, error: null });
        try {
          const res = await fetch("/api/entries");
          if (res.ok) {
            const data = await res.json();
            if (data.entries) {
              set({ entries: data.entries });
            }
          }
        } catch (err) {
          console.warn("Server fetch failed, running local mode only.", err);
        } finally {
          set({ isSyncing: false });
        }
      },

      addOrUpdateEntry: async (newEntry) => {
        const currentEntries = get().entries;
        const index = currentEntries.findIndex((e) => e.date === newEntry.date);
        
        let updatedEntries = [...currentEntries];
        if (index > -1) {
          updatedEntries[index] = newEntry;
        } else {
          updatedEntries.push(newEntry);
        }
        
        // Sort entries by date desc
        updatedEntries.sort((a, b) => b.date.localeCompare(a.date));
        set({ entries: updatedEntries });

        // Sync with API
        try {
          const res = await fetch("/api/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEntry),
          });
          if (!res.ok) {
            const errData = await res.json();
            console.warn("API sync issue:", errData.error);
          }
          return res.ok;
        } catch (err) {
          console.warn("Network offline or server api unavailable, saved locally.");
          return true;
        }
      },

      deleteEntry: async (date) => {
        const updatedEntries = get().entries.filter((e) => e.date !== date);
        set({ entries: updatedEntries });

        try {
          const res = await fetch(`/api/check-in?date=${date}`, {
            method: "DELETE",
          });
          return res.ok;
        } catch (err) {
          console.warn("Network offline, deleted locally.");
          return true;
        }
      },

      clearAllData: () => {
        set({ entries: [] });
      },

      generateMockData: () => {
        const mockEntries: LogEntry[] = [];
        const moodLabels = ["Terrible", "Bad", "Below Average", "Average", "Good", "Great", "Excellent", "Harvey"];
        const workoutTypes = ["Running", "Weightlifting", "Yoga", "Swimming", "Cycling"];
        const bookNames = ["Atomic Habits", "Deep Work", "Thinking, Fast and Slow", "Dune", "Sapiens"];
        const studyTopics = ["Next.js App Router", "TypeScript Advanced Patterns", "Linear Algebra", "System Design"];

        const today = new Date();

        for (let i = 29; i >= 0; i--) {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() - i);
          const dateString = currentDate.toISOString().split("T")[0];

          // Generate somewhat correlated metrics
          // If exercise is true, mood and productivity tend to be higher.
          const workout_done = Math.random() > 0.4;
          const sleep_hours = Math.round((6 + Math.random() * 3 + (workout_done ? 0.5 : 0)) * 10) / 10;
          const sleep_quality = Math.min(10, Math.round(sleep_hours + Math.random() * 2 - 1));
          
          const stress_level = Math.max(1, Math.min(10, Math.round(8 - (sleep_hours - 5) - (workout_done ? 1.5 : 0) + Math.random() * 2)));
          const productivity_level = Math.max(1, Math.min(10, Math.round(5 + (sleep_hours > 7 ? 2 : -1) + (workout_done ? 1 : 0) + Math.random() * 2)));
          const focus_level = Math.max(1, Math.min(10, Math.round((productivity_level + sleep_quality) / 2 + Math.random() * 2 - 1)));
          
          // Mood matches energy and productivity
          const avgScore = (sleep_quality + productivity_level + (11 - stress_level)) / 3;
          const mood_score = Math.max(1, Math.min(8, Math.round((avgScore / 10) * 8 + Math.random() * 1)));
          const mood_label = moodLabels[mood_score - 1] || "Good";
          
          const energy_level = Math.max(1, Math.min(10, Math.round((sleep_quality + mood_score) / 2 * 1.25)));
          const water_intake = Math.round(1500 + Math.random() * 1500 + (workout_done ? 1000 : 0));
          const junk_food = Math.random() > 0.7;
          const social_interaction = Math.floor(Math.random() * 10) + 1;

          const life_score = calculateLifeScore({
            moodScore: mood_score,
            sleepQuality: sleep_quality,
            focusLevel: focus_level,
            productivityLevel: productivity_level,
            stressLevel: stress_level,
            workoutDone: workout_done
          });

          mockEntries.push({
            date: dateString,
            mood_score,
            mood_label,
            sleep_hours,
            sleep_quality,
            energy_level,
            focus_level,
            productivity_level,
            stress_level,
            water_intake,
            junk_food,
            social_interaction,
            life_score,
            workout_done,
            exercise_duration: workout_done ? Math.floor(20 + Math.random() * 60) : 0,
            workout_type: workout_done ? workoutTypes[Math.floor(Math.random() * workoutTypes.length)] : "",
            pages_read: Math.random() > 0.5 ? Math.floor(5 + Math.random() * 30) : 0,
            book_name: Math.random() > 0.5 ? bookNames[Math.floor(Math.random() * bookNames.length)] : "",
            study_hours: Math.random() > 0.6 ? Math.round((0.5 + Math.random() * 4) * 10) / 10 : 0,
            study_topic: Math.random() > 0.6 ? studyTopics[Math.floor(Math.random() * studyTopics.length)] : "",
            notes: `Logged on ${dateString}. Felt ${mood_label.toLowerCase()} today.`,
            wins: Math.random() > 0.3 ? "Completed all key objectives!" : undefined,
            challenges: Math.random() > 0.7 ? "Felt a bit tired in the afternoon." : undefined
          });
        }

        mockEntries.sort((a, b) => b.date.localeCompare(a.date));
        set({ entries: mockEntries });
      },
    }),
    {
      name: "lifeos-storage",
      partialize: (state) => ({ entries: state.entries, isAuthenticated: state.isAuthenticated }),
    }
  )
);
