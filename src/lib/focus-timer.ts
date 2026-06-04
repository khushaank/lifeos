export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface FocusTimerPayload {
  selected_minutes: number;
  status: TimerStatus;
  ends_at: string | null;
  remaining_seconds: number;
  sessions_completed_date: string | null;
  sessions_completed_count: number;
  updated_at?: string;
}

export interface FocusTimerClientState {
  selectedMinutes: number;
  status: TimerStatus;
  endsAt: string | null;
  remainingSeconds: number;
  sessionsCompletedDate: string | null;
  sessionsCompletedCount: number;
}

export function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function resolveFocusTimer(
  raw: FocusTimerPayload,
  now = Date.now()
): FocusTimerClientState {
  let status = raw.status;
  let remainingSeconds = raw.remaining_seconds;
  const selectedMinutes = raw.selected_minutes;

  if (status === "running" && raw.ends_at) {
    const left = Math.max(0, Math.ceil((new Date(raw.ends_at).getTime() - now) / 1000));
    remainingSeconds = left;
    if (left <= 0) {
      status = "completed";
      remainingSeconds = 0;
    }
  }

  const today = todayDateString();
  let sessionsCompletedDate = raw.sessions_completed_date;
  let sessionsCompletedCount = raw.sessions_completed_count;

  if (sessionsCompletedDate !== today) {
    sessionsCompletedDate = today;
    sessionsCompletedCount = 0;
  }

  return {
    selectedMinutes,
    status,
    endsAt: raw.ends_at,
    remainingSeconds,
    sessionsCompletedDate,
    sessionsCompletedCount,
  };
}

export function payloadFromClient(state: FocusTimerClientState): FocusTimerPayload {
  return {
    selected_minutes: state.selectedMinutes,
    status: state.status,
    ends_at: state.endsAt,
    remaining_seconds: state.remainingSeconds,
    sessions_completed_date: state.sessionsCompletedDate,
    sessions_completed_count: state.sessionsCompletedCount,
  };
}

export function formatTimerDisplay(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
