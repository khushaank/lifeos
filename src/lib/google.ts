import type { LifeTask } from "@/store/useLifeStore";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

let accessToken: string | null = null;

const GOOGLE_TOKEN_KEY = "lifeos-google-access-token";
const GOOGLE_TOKEN_EXPIRES_KEY = "lifeos-google-token-expires-at";
const GOOGLE_CONNECTED_KEY = "lifeos-google-connected";
const GOOGLE_LAST_CONNECTED_KEY = "lifeos-google-last-connected-at";

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(GOOGLE_TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(GOOGLE_TOKEN_EXPIRES_KEY) || 0);
  if (!token || !expiresAt || Date.now() >= expiresAt - 60_000) {
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_TOKEN_EXPIRES_KEY);
    return null;
  }
  return token;
}

function saveAccessToken(token: string, expiresIn = 3600) {
  if (typeof window === "undefined") return;
  accessToken = token;
  localStorage.setItem(GOOGLE_TOKEN_KEY, token);
  localStorage.setItem(GOOGLE_TOKEN_EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
  localStorage.setItem(GOOGLE_CONNECTED_KEY, "true");
  localStorage.setItem(GOOGLE_LAST_CONNECTED_KEY, new Date().toISOString());
}

function clearAccessToken({ keepConnected = true } = {}) {
  accessToken = null;
  if (typeof window === "undefined") return;
  localStorage.removeItem(GOOGLE_TOKEN_KEY);
  localStorage.removeItem(GOOGLE_TOKEN_EXPIRES_KEY);
  if (!keepConnected) {
    localStorage.removeItem(GOOGLE_CONNECTED_KEY);
    localStorage.removeItem(GOOGLE_LAST_CONNECTED_KEY);
  }
}

export function getStoredGoogleClientId() {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "390278448587-68evhbhdm0sohmjqs6ikdvrth1ngue0p.apps.googleusercontent.com";
  return localStorage.getItem("lifeos-google-client-id") || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "390278448587-68evhbhdm0sohmjqs6ikdvrth1ngue0p.apps.googleusercontent.com";
}

export function saveGoogleClientId(clientId: string) {
  localStorage.setItem("lifeos-google-client-id", clientId.trim());
}

export function hasGoogleToken() {
  if (accessToken) return true;
  const stored = getStoredAccessToken();
  if (stored) {
    accessToken = stored;
    return true;
  }
  return false;
}

export function hasSavedGoogleConnection() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GOOGLE_CONNECTED_KEY) === "true";
}

export function getGoogleConnectionSnapshot() {
  if (typeof window === "undefined") {
    return { connected: false, clientId: getStoredGoogleClientId(), lastConnectedAt: null };
  }
  return {
    connected: hasGoogleToken() || hasSavedGoogleConnection(),
    clientId: getStoredGoogleClientId(),
    lastConnectedAt: localStorage.getItem(GOOGLE_LAST_CONNECTED_KEY),
  };
}

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity script failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity script failed to load."));
    document.head.appendChild(script);
  });
}

export async function connectGoogle(clientId = getStoredGoogleClientId(), options: { prompt?: "consent" | "" } = {}) {
  if (!clientId) {
    throw new Error("Add a Google OAuth Client ID in Settings first.");
  }

  saveGoogleClientId(clientId);
  await loadGoogleScript();

  return new Promise<string>((resolve, reject) => {
    const client = window.google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || "Google authorization failed."));
          return;
        }
        saveAccessToken(response.access_token, response.expires_in);
        resolve(response.access_token);
      },
    });

    client?.requestAccessToken({
      prompt: options.prompt ?? (hasSavedGoogleConnection() ? "" : "consent"),
    });
  });
}

export function disconnectGoogle() {
  if (!accessToken || !window.google?.accounts?.oauth2) {
    clearAccessToken({ keepConnected: false });
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    window.google?.accounts.oauth2.revoke(accessToken as string, () => {
      clearAccessToken({ keepConnected: false });
      resolve();
    });
  });
}

async function googleFetch<T>(url: string, init: RequestInit = {}) {
  if (!accessToken) {
    const stored = getStoredAccessToken();
    if (stored) {
      accessToken = stored;
    } else {
      await connectGoogle(getStoredGoogleClientId(), { prompt: hasSavedGoogleConnection() ? "" : "consent" });
    }
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  if (response.status === 401) {
    clearAccessToken({ keepConnected: true });
    throw new Error("Google session expired. Reconnect once and LifeOS will remember this browser.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Google request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

const toDateTime = (task: LifeTask) => {
  const date = task.due_date;
  const time = task.due_time || "09:00";
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 45);
  return { start, end };
};

export async function createGoogleCalendarEvent(task: LifeTask) {
  const { start, end } = toDateTime(task);
  return googleFetch<{ id: string; htmlLink?: string }>("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify({
      summary: task.title,
      description: [task.notes, `Priority: ${task.priority}`, `Area: ${task.area}`, "Created from LifeOS"].filter(Boolean).join("\n"),
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    }),
  });
}

async function getDefaultTaskListId() {
  const lists = await googleFetch<{ items?: Array<{ id: string; title: string }> }>("https://tasks.googleapis.com/tasks/v1/users/@me/lists");
  return lists.items?.[0]?.id;
}

export async function createGoogleTask(task: LifeTask) {
  const taskListId = await getDefaultTaskListId();
  if (!taskListId) {
    throw new Error("No Google Tasks list found for this account.");
  }

  return googleFetch<{ id: string; webViewLink?: string }>(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`, {
    method: "POST",
    body: JSON.stringify({
      title: task.title,
      notes: [task.notes, `Priority: ${task.priority}`, `Area: ${task.area}`, "Created from LifeOS"].filter(Boolean).join("\n"),
      due: new Date(`${task.due_date}T00:00:00`).toISOString(),
    }),
  });
}

export async function syncTaskToGoogle(task: LifeTask) {
  const [event, googleTask] = await Promise.all([createGoogleCalendarEvent(task), createGoogleTask(task)]);
  return {
    google_event_id: event.id,
    google_task_id: googleTask.id,
    google_synced_at: new Date().toISOString(),
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: string;
}

export async function fetchGoogleCalendarEvents(timeMin: string, timeMax: string): Promise<GoogleCalendarEvent[]> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
  const res = await googleFetch<{ items?: GoogleCalendarEvent[] }>(url);
  return res.items || [];
}

export async function fetchGoogleTasks(): Promise<GoogleTaskItem[]> {
  const taskListId = await getDefaultTaskListId();
  if (!taskListId) return [];
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`;
  const res = await googleFetch<{ items?: GoogleTaskItem[] }>(url);
  return res.items || [];
}

