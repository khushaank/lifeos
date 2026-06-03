"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Flame, Loader2, Sparkles, TrendingUp, Moon, Zap } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const setAuthenticated = useLifeStore((state) => state.setAuthenticated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError("Invalid server response. Please try again.");
        setLoading(false);
        return;
      }

      if (res.ok && data.success) {
        setAuthenticated(true);
        router.push("/");
      } else {
        setError(data.error || "Authentication failed. Please check your password.");
      }
    } catch (err: any) {
      setError(`Connection error: ${err?.message || "Please ensure the server is running."}`);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, label: "Track daily metrics", color: "text-teal-500" },
    { icon: Moon, label: "Sleep & energy insights", color: "text-indigo-500" },
    { icon: Zap, label: "AI-powered correlations", color: "text-amber-500" },
    { icon: Sparkles, label: "Life Score analytics", color: "text-rose-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-16 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40 blur-2xl" />

        <div className="relative z-10 text-center text-white space-y-10 max-w-md">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur shadow-lg">
              <Flame className="h-8 w-8 fill-current text-white" />
            </div>
            <span className="text-4xl font-black tracking-tight">LifeOS</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">
              Your Personal<br />Life Analytics System
            </h1>
            <p className="text-teal-100 text-base leading-relaxed">
              Track sleep, mood, productivity, habits and exercise. Discover hidden patterns that drive your best days.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/90 font-medium">{f.label}</span>
                </div>
              );
            })}
          </div>

          <p className="text-teal-200/70 text-xs">
            Single-tenant · Private · Offline-ready
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500">
            <Flame className="h-6 w-6 fill-current text-white" />
          </div>
          <span className="text-2xl font-black text-slate-800">LifeOS</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 text-sm">Enter your private access key to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">
                Access Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus
                  className="pl-10 h-12 bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus-visible:ring-teal-400 focus-visible:border-teal-400 shadow-sm rounded-xl"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold cursor-pointer rounded-xl shadow-md shadow-teal-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Unlocking Dashboard...
                </>
              ) : (
                "Unlock Dashboard"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Default password:{" "}
              <code className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">
                lifeos123
              </code>{" "}
              or{" "}
              <code className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">
                123456
              </code>
              . Change it in Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
