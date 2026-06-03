"use client";

import { useState } from "react";
import { useLifeStore } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/navigation";
import { KeyRound, Sparkles, Database, Trash2, CheckCircle2, ShieldAlert, Info } from "lucide-react";

export default function SettingsPage() {
  const generateMockData = useLifeStore((state) => state.generateMockData);
  const clearAllData = useLifeStore((state) => state.clearAllData);
  const entries = useLifeStore((state) => state.entries);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passStatus, setPassStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus(null);

    if (newPassword !== confirmPassword) {
      setPassStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPassStatus({ type: "error", msg: "Password must be at least 6 characters." });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassStatus({ type: "success", msg: "Password updated successfully!" });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        setPassStatus({ type: "error", msg: data.error || "Password update failed." });
      }
    } catch {
      setPassStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setPassLoading(false);
    }
  };

  const handleGenerateMock = () => {
    if (confirm("This will generate 30 days of sample data. This may overwrite today's existing entry. Proceed?")) {
      generateMockData();
    }
  };

  const handleClear = () => {
    if (confirm("This will permanently delete all locally cached check-in data. Are you sure?")) {
      clearAllData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans md:pl-64 pb-20">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">Manage credentials, data, and system utilities</p>
        </div>

        {/* Database Status */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
              <Database className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Database & Sync Status</CardTitle>
              <CardDescription className="text-xs text-slate-400">Local cache and Supabase connection info</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Local cache active — <strong>{entries.length}</strong> entries stored in browser.</span>
            </div>
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Entries sync to Supabase automatically when you save check-ins. Offline saves are cached locally and stay available between sessions.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="h-9 w-9 rounded-xl bg-teal-50 ring-1 ring-teal-200 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Change Password</CardTitle>
              <CardDescription className="text-xs text-slate-400">Update your single-tenant access credential</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="bg-slate-50 border-slate-200 text-slate-800 h-10" />
              </div>

              {passStatus && (
                <div className={`text-xs rounded-xl px-4 py-3 border ${
                  passStatus.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}>
                  {passStatus.msg}
                </div>
              )}

              <Button type="submit" disabled={passLoading}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold cursor-pointer shadow-sm rounded-xl">
                {passLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="h-9 w-9 rounded-xl bg-violet-50 ring-1 ring-violet-200 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Developer Utilities</CardTitle>
              <CardDescription className="text-xs text-slate-400">Generate sample data or reset the local cache</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-violet-700 mb-0.5">Generate Demo Data</p>
              <p className="text-xs text-violet-600">
                Creates 30 days of realistic, correlated sample data so you can explore the dashboard, trend charts, and AI insights immediately.
              </p>
              <Button onClick={handleGenerateMock}
                className="mt-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold cursor-pointer rounded-xl shadow-sm text-sm">
                Generate 30 Days of Mock Data
              </Button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-rose-700">Clear All Local Data</p>
                  <p className="text-xs text-rose-600">Permanently removes all locally cached entries from your browser. This cannot be undone.</p>
                </div>
              </div>
              <Button onClick={handleClear} variant="outline"
                className="border-rose-300 text-rose-600 hover:bg-rose-100 cursor-pointer rounded-xl text-sm">
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
