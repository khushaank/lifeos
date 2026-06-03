"use client";

import { useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLifeStore, type LifeTask } from "@/store/useLifeStore";
import { connectGoogle, disconnectGoogle, hasGoogleToken, syncTaskToGoogle } from "@/lib/google";
import { CalendarPlus, CheckCircle2, Circle, Link2, ListTodo, Plus, Trash2 } from "lucide-react";

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
        isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
      )}
    >
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
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
          <div className="flex flex-wrap gap-2">
            <Button onClick={googleConnected ? handleDisconnectGoogle : handleConnectGoogle} variant="outline" className="border-slate-200 text-slate-600 cursor-pointer">
              <Link2 className="mr-2 h-4 w-4" />
              {googleConnected ? "Disconnect Google" : "Connect Google"}
            </Button>
            <Button onClick={handleSyncAll} disabled={!activeTasks.length || Boolean(syncingId)} className="bg-sky-500 hover:bg-sky-600 text-white cursor-pointer">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Sync Open Tasks
            </Button>
          </div>
        </div>

        {syncStatus && <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{syncStatus}</div>}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800">Add Task</CardTitle>
              <CardDescription className="text-xs text-slate-500">Create a task and optionally send it to Google Calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Task</Label>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Deep work block" className="h-10 bg-slate-50 border-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Date</Label>
                    <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-10 bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Time</Label>
                    <Input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} className="h-10 bg-slate-50 border-slate-200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                    <select value={priority} onChange={(event) => setPriority(event.target.value as LifeTask["priority"])} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-800">
                      {priorities.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Area</Label>
                    <select value={area} onChange={(event) => setArea(event.target.value as LifeTask["area"])} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-800">
                      {areas.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">Notes</Label>
                  <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Context, links, or next action" className="h-20 resize-none bg-slate-50 border-slate-200" />
                </div>

                <Button type="submit" className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white font-semibold cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Open", value: activeTasks.length, color: "text-sky-600 bg-sky-50 border-sky-200" },
                { label: "High Priority", value: activeTasks.filter((task) => task.priority === "High").length, color: "text-rose-600 bg-rose-50 border-rose-200" },
                { label: "Done", value: doneTasks.length, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-2xl border px-4 py-3 ${stat.color}`}>
                  <p className="text-xs font-semibold">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>

            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-800">Active Plan</CardTitle>
                <CardDescription className="text-xs text-slate-500">Each item can be opened in Google Calendar or completed locally</CardDescription>
              </CardHeader>
              <CardContent>
                {activeTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                    <ListTodo className="h-9 w-9 text-slate-300 mb-3" />
                    <p className="font-medium">No active tasks</p>
                    <p className="text-xs mt-1">Add a task to start planning your day.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {activeTasks.map((task) => (
                      <div key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            onClick={() => updateTask(task.id, { status: "Done" })}
                            className="mt-0.5 text-slate-300 hover:text-emerald-500 cursor-pointer"
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

            {doneTasks.length > 0 && (
              <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-slate-800">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {doneTasks.slice(0, 6).map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          {task.title}
                        </span>
                        <Button onClick={() => updateTask(task.id, { status: "Todo" })} variant="ghost" size="sm" className="text-emerald-700 cursor-pointer">
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
    </div>
  );
}
