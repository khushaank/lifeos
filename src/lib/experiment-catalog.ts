export type ExperimentTrackType =
  | "youtube"
  | "study"
  | "workout"
  | "reading"
  | "custom";

export type ExperimentTemplate = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  durationDays: number;
  trackType: ExperimentTrackType;
  dailyPrompt: string;
  category: string;
  accent: string;
};

export const EXPERIMENT_DURATION_DAYS = 90;

export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  {
    id: "youtube-upload-90",
    name: "YouTube Upload Challenge",
    tagline: "Ship one video every day for 90 days",
    description:
      "Build a publishing habit. Log each day you uploaded (or published) a video. After 90 days this challenge ends automatically.",
    durationDays: EXPERIMENT_DURATION_DAYS,
    trackType: "youtube",
    dailyPrompt: "Did you upload or publish a YouTube video today?",
    category: "Creator",
    accent: "bg-red-500",
  },
  {
    id: "study-deep-90",
    name: "Deep Study 90",
    tagline: "Focused learning every single day",
    description:
      "Hold yourself to meaningful study time daily. Pair with check-ins for automatic study-hour tracking.",
    durationDays: EXPERIMENT_DURATION_DAYS,
    trackType: "study",
    dailyPrompt: "Did you complete your planned study session today?",
    category: "Learning",
    accent: "bg-violet-500",
  },
  {
    id: "workout-daily-90",
    name: "Move Daily 90",
    tagline: "No zero days for movement",
    description:
      "Workout, walk, or active recovery — mark done when you moved with intention today.",
    durationDays: EXPERIMENT_DURATION_DAYS,
    trackType: "workout",
    dailyPrompt: "Did you work out or move intentionally today?",
    category: "Health",
    accent: "bg-emerald-500",
  },
  {
    id: "reading-90",
    name: "Pages & Presence 90",
    tagline: "Read something meaningful daily",
    description:
      "Books, papers, or deep articles — build a reading streak over 90 days.",
    durationDays: EXPERIMENT_DURATION_DAYS,
    trackType: "reading",
    dailyPrompt: "Did you read today (pages or focused reading block)?",
    category: "Learning",
    accent: "bg-sky-500",
  },
  {
    id: "custom-90",
    name: "Build Your Own 90",
    tagline: "Any habit, 90 days",
    description:
      "Define your own daily question — meditation, coding, sales calls, anything. Expires after 90 days.",
    durationDays: EXPERIMENT_DURATION_DAYS,
    trackType: "custom",
    dailyPrompt: "Did you complete your habit today?",
    category: "Custom",
    accent: "bg-amber-500",
  },
];

export function getTemplate(id: string) {
  return EXPERIMENT_TEMPLATES.find((t) => t.id === id);
}
