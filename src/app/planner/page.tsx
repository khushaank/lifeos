"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLifeStore, type LifeTask } from "@/store/useLifeStore";
import {
  connectGoogle,
  disconnectGoogle,
  hasGoogleToken,
  syncTaskToGoogle,
  fetchGoogleCalendarEvents,
  fetchGoogleTasks,
  type GoogleCalendarEvent,
  type GoogleTaskItem,
} from "@/lib/google";
import { CalendarPlus, CheckCircle2, Circle, Link2, ListTodo, Plus, Trash2, Calendar, CheckSquare, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const priorities: LifeTask["priority"][] = ["Medium", "High", "Low"];
const areas: LifeTask["area"][] = ["Work", "Health", "Learning", "Personal"];

export default function PlannerPage() {
  const tasks = useLifeStore((state) => state.tasks);
  const addTask = useLifeStore((state) => state.addTask);
  const updateTask = useLifeStore((state) => state.updateTask);
  const deleteTask = useLifeStore((state) => state.deleteTask);
  const isSidebarCollapsed = useLifeStore((state) => state.isSidebarCollapsed);

  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [dueTime, setDueTime] = useState("09:00");
  const [priority, setPriority] = useState<LifeTask["priority"]>("Medium");
  const [area, setArea] = useState<LifeTask["area"]>("Work");
  const [notes, setNotes] = useState("");
  const [googleConnected, setGoogleConnected] = useState(hasGoogleToken());
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Google Feed States
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleTasks, setGoogleTasks] = useState<GoogleTaskItem[]>([]);
  const [googleFeedPeriod, setGoogleFeedPeriod] = useState<"Today" | "7 Days" | "30 Days">("7 Days");
  const [fetchingGoogleFeed, setFetchingGoogleFeed] = useState(false);

  const getPeriodDates = (period: string) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === "Today") {
      // Keep end as today
    } else if (period === "7 Days") {
      end.setDate(end.getDate() + 7);
    } else if (period === "30 Days") {
      end.setDate(end.getDate() + 30);
    }

    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    };
  };

  const loadGoogleFeed = async () => {
    if (!googleConnected) return;
    try {
      setFetchingGoogleFeed(true);
      const { timeMin, timeMax } = getPeriodDates(googleFeedPeriod);
      const [events, gTasks] = await Promise.all([
        fetchGoogleCalendarEvents(timeMin, timeMax),
        fetchGoogleTasks(),
      ]);
      setGoogleEvents(events);

      const endLimit = new Date(timeMax).getTime();
      const filteredTasks = gTasks.filter((t) => {
        if (!t.due) return true;
        return new Date(t.due).getTime() <= endLimit;
      });
      setGoogleTasks(filteredTasks);
    } catch (err) {
      console.error("Failed to load Google Feed:", err);
    } finally {
      setFetchingGoogleFeed(false);
    }
  };

  useEffect(() => {
    if (googleConnected) {
      loadGoogleFeed();
    } else {
      setGoogleEvents([]);
      setGoogleTasks([]);
    }
  }, [googleConnected, googleFeedPeriod]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const dateCompare = `${a.due_date}${a.due_time || ""}`.localeCompare(`${b.due_date}${b.due_time || ""}`);
        if (dateCompare !== 0) return dateCompare;
        return a.title.localeCompare(b.title);
      }),
    [tasks]
  );

  const activeTasks = sortedTasks.filter((task) => task.status !== "Done");
  const doneTasks = sortedTasks.filter((task) => task.status === "Done");

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      due_date: dueDate,
      due_time: dueTime,
      notes: notes.trim(),
      priority,
      area,
      status: "Todo",
    });
    setTitle("");
    setNotes("");
    setIsAddModalOpen(false);
  };

  const handleConnectGoogle = async () => {
    try {
      setSyncStatus(null);
      await connectGoogle();
      setGoogleConnected(true);
      setSyncStatus("Google connected. You can now sync tasks directly.");
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Google connection failed.");
    }
  };

  const handleDisconnectGoogle = async () => {
    await disconnectGoogle();
    setGoogleConnected(false);
    setSyncStatus("Google disconnected for this browser session.");
  };

  const handleSyncTask = async (task: LifeTask) => {
    try {
      setSyncingId(task.id);
      setSyncStatus(null);
      const updates = await syncTaskToGoogle(task);
      updateTask(task.id, updates);
      setGoogleConnected(true);
      setSyncStatus(`Synced "${task.title}" to Google Calendar and Google Tasks.`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Google sync failed.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    for (const task of activeTasks.filter((item) => !item.google_synced_at)) {
      await handleSyncTask(task);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-slate-50 font-sans pb-24 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:pl-[4.25rem]" : "md:pl-56"
      )}
    >
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col gap-4 bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-sky-50 ring-1 ring-sky-200 flex items-center justify-center">
              <ListTodo className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Planner</h1>
              <p className="text-sm text-slate-500">Tasks, routines, and Google-ready calendar blocks</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold cursor-pointer h-10 shadow-md shadow-sky-500/10 px-5"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Task
            </Button>
            <Button onClick={googleConnected ? handleDisconnectGoogle : handleConnectGoogle} variant="outline" className="border-slate-200 text-slate-600 cursor-pointer h-10">
              <Link2 className="mr-2 h-4 w-4" />
              {googleConnected ? "Disconnect Google" : "Connect Google"}
            </Button>
            <Button
              onClick={handleSyncAll}
              disabled={!activeTasks.length || Boolean(syncingId)}
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-10"
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Sync Open Tasks
            </Button>
          </div>
        </div>

        {syncStatus && <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{syncStatus}</div>}

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Open", value: activeTasks.length, color: "text-sky-600 bg-sky-50 border-sky-200" },
            { label: "High Priority", value: activeTasks.filter((task) => task.priority === "High").length, color: "text-rose-600 bg-rose-50 border-rose-200" },
            { label: "Done", value: doneTasks.length, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border px-5 py-4 shadow-sm ${stat.color}`}>
              <p className="text-xs font-semibold">{stat.label}</p>
              <p className="text-3xl font-black mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Structured Column Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Active Plan list (Col-span-2) */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-base font-bold text-slate-800">Active Plan</CardTitle>
                <CardDescription className="text-xs text-slate-500">Each item can be opened in Google Calendar or completed locally</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {activeTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm text-center">
                    <img src="/images/empty_tasks.png" alt="No tasks" className="w-48 h-auto object-contain mb-4 rounded-xl opacity-90 mix-blend-multiply" />
                    <p className="font-semibold text-slate-700 text-sm">No active tasks</p>
                    <p className="text-xs text-slate-400 max-w-[200px] mt-1">Add a task to start planning your day.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeTasks.map((task) => (
                      <div key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            onClick={() => updateTask(task.id, { status: "Done" })}
                            className="mt-0.5 text-slate-300 hover:text-emerald-500 cursor-pointer transition-colors"
                            aria-label={`Mark ${task.title} done`}
                          >
                            <Circle className="h-5 w-5" />
                          </button>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-sm text-slate-800">{task.title}</p>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{task.area}</span>
                              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600">{task.priority}</span>
                              {task.google_synced_at && (
                                <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-600">
                                  Google synced
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {task.due_date} {task.due_time ? `at ${task.due_time}` : ""}{task.notes ? ` - ${task.notes}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:ml-4">
                          <Button onClick={() => handleSyncTask(task)} disabled={syncingId === task.id} variant="outline" size="sm" className="border-slate-200 text-slate-600 cursor-pointer">
                            <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                            {syncingId === task.id ? "Syncing" : "Sync Google"}
                          </Button>
                          <Button onClick={() => deleteTask(task.id)} variant="outline" size="icon-sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label={`Delete ${task.title}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area: Google Feed and Completed tasks (Col-span-1) */}
          <div className="lg:col-span-1 space-y-5">
            {googleConnected && (
              <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      Google Feed
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-400 font-medium">Upcoming agenda events</CardDescription>
                  </div>
                  <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                    {(["Today", "7 Days", "30 Days"] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setGoogleFeedPeriod(period)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                          googleFeedPeriod === period
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {fetchingGoogleFeed ? (
                    <div className="flex items-center justify-center py-6 text-slate-500 text-xs gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                      <span>Loading Google feed...</span>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Calendar Section */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-sky-500" />
                          Events ({googleEvents.length})
                        </h3>
                        {googleEvents.length === 0 ? (
                          <p className="text-xs text-slate-400 py-1.5 italic">No events scheduled.</p>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {googleEvents.map((event) => {
                              const start = event.start.dateTime
                                ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : "All Day";
                              const date = event.start.dateTime
                                ? new Date(event.start.dateTime).toLocaleDateString([], { month: "short", day: "numeric" })
                                : event.start.date || "";
                              return (
                                <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 hover:border-slate-200 transition-colors">
                                  <p className="font-semibold text-xs text-slate-800 line-clamp-1">{event.summary || "Untitled Event"}</p>
                                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                                    <span className="font-medium text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">{date}</span>
                                    <span>{start}</span>
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Tasks Section */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5 text-sky-500" />
                          Tasks ({googleTasks.length})
                        </h3>
                        {googleTasks.length === 0 ? (
                          <p className="text-xs text-slate-400 py-1.5 italic">No tasks found.</p>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {googleTasks.map((task) => {
                              const dueDate = task.due
                                ? new Date(task.due).toLocaleDateString([], { month: "short", day: "numeric" })
                                : "No due date";
                              return (
                                <div key={task.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 hover:border-slate-200 transition-colors flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className={cn(
                                      "font-semibold text-xs text-slate-800 line-clamp-1",
                                      task.status === "completed" && "line-through text-slate-400"
                                    )}>
                                      {task.title || "Untitled Task"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                      <span className="font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{dueDate}</span>
                                    </p>
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase px-1.5 py-0.5 rounded border flex-shrink-0",
                                    task.status === "completed"
                                      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                                      : "text-amber-600 bg-amber-50 border-amber-200"
                                  )}>
                                    {task.status === "completed" ? "Done" : "Todo"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {doneTasks.length > 0 && (
              <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-800">Completed</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {doneTasks.slice(0, 8).map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700">
                        <span className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{task.title}</span>
                        </span>
                        <Button onClick={() => updateTask(task.id, { status: "Todo" })} variant="ghost" size="sm" className="text-[10px] h-7 text-emerald-700 hover:bg-emerald-100 cursor-pointer px-2 flex-shrink-0">
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Add Task Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 flex-shrink-0">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Add Task</CardTitle>
                <CardDescription className="text-xs text-slate-500">Create a task and optionally send it to Google Calendar</CardDescription>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Task Title</Label>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Deep work block" className="h-10 bg-slate-50 border-slate-200" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Date</Label>
                    <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-10 bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Time</Label>
                    <Input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} className="h-10 bg-slate-50 border-slate-200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Priority</Label>
                    <select value={priority} onChange={(event) => setPriority(event.target.value as LifeTask["priority"])} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800">
                      {priorities.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Area</Label>
                    <select value={area} onChange={(event) => setArea(event.target.value as LifeTask["area"])} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800">
                      {areas.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Notes</Label>
                  <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Context, links, or next action" className="h-20 resize-none bg-slate-50 border-slate-200" />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <Button type="button" onClick={() => setIsAddModalOpen(false)} variant="outline" className="flex-1 h-10 border-slate-200 text-slate-600 font-semibold cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white font-semibold cursor-pointer shadow-md shadow-sky-500/10">
                    Add Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  );
}
