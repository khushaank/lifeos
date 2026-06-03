"use client";

import { useRef, useState } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Database, Download, KeyRound, ShieldAlert, Trash2, Upload } from "lucide-react";
import { downloadTextFile } from "@/lib/integrations";

import { cn } from "@/lib/utils";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function SettingsPage() {
  const clearAllData = useLifeStore((state) => state.clearAllData);
  const entries = useLifeStore((state) => state.entries);
  const tasks = useLifeStore((state) => state.tasks);
  const goals = useLifeStore((state) => state.goals);
  const updateGoal = useLifeStore((state) => state.updateGoal);
  const importData = useLifeStore((state) => state.importData);
  const exportData = useLifeStore((state) => state.exportData);
  const isSidebarCollapsed = useLifeStore((state) => state.isSidebarCollapsed);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newKey, setNewKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleUpdateKey = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newKey.length < 6) {
      setStatus("Password must be at least 6 characters.");
      return;
    }
    try {
      const passwordHash = await hashPassword(newKey);
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordHash }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewKey("");
        setStatus("Password updated successfully in Supabase.");
      } else {
        setStatus(data.error || "Failed to update password.");
      }
    } catch (err) {
      setStatus("Error updating password. Please try again.");
    }
  };

  const handleExport = () => {
    downloadTextFile("lifeos-data.json", JSON.stringify(exportData(), null, 2), "application/json");
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      importData(JSON.parse(text));
      setStatus("Data imported successfully.");
    } catch {
      setStatus("Import failed. Choose a valid LifeOS JSON export.");
    }
  };

  const handleClear = () => {
    if (confirm("This will permanently delete all locally cached LifeOS data. Are you sure?")) {
      clearAllData();
    }
  };



  return (
    <div
      className={cn(
        "min-h-screen bg-slate-50 font-sans pb-20 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
      )}
    >
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-8 space-y-5">
        <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">Manage local access, data portability, and targets</p>
        </div>

        {status && <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{status}</div>}

        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
              <Database className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Local Data</CardTitle>
              <CardDescription className="text-xs text-slate-400">GitHub Pages compatible browser storage</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Entries", value: entries.length },
                { label: "Tasks", value: tasks.length },
                { label: "Goals", value: goals.length },
                { label: "Storage", value: "Local" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-lg font-black text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExport} className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-slate-200 text-slate-600 cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Import JSON
              </Button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => handleImport(event.target.files?.[0])} />
            </div>
          </CardContent>
        </Card>



        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="h-9 w-9 rounded-xl bg-teal-50 ring-1 ring-teal-200 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Change Password</CardTitle>
              <CardDescription className="text-xs text-slate-400">Updates the access password hashed in Supabase</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateKey} className="flex flex-col gap-3 sm:flex-row">
              <Input type="password" value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder="New password" className="h-10 bg-slate-50 border-slate-200" />
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-semibold cursor-pointer h-10">
                Save Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">Daily Targets</CardTitle>
            <CardDescription className="text-xs text-slate-400">These power the dashboard target panel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3 sm:grid-cols-[1fr_130px_120px]">
                <Input value={goal.title} onChange={(event) => updateGoal(goal.id, { title: event.target.value })} className="h-9 bg-white border-slate-200" />
                <Input value={goal.target} onChange={(event) => updateGoal(goal.id, { target: event.target.value })} className="h-9 bg-white border-slate-200" />
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max="100" value={goal.progress} onChange={(event) => updateGoal(goal.id, { progress: Number(event.target.value) })} className="h-9 bg-white border-slate-200" />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">Reset Controls</CardTitle>
            <CardDescription className="text-xs text-slate-400">Clear your local browser vault</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-rose-700">Clear All Local Data</p>
                  <p className="text-xs text-rose-600">Permanently removes cached entries, tasks, and target changes from this browser.</p>
                </div>
              </div>
              <Button onClick={handleClear} variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-100 cursor-pointer rounded-xl text-sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Local Store
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
