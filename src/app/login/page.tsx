"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Loader2, Lock, Moon, Sparkles, TrendingUp, Zap } from "lucide-react";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const setAuthenticated = useLifeStore((state) => state.setAuthenticated);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const passwordHash = await hashPassword(password);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordHash }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuthenticated(true);
        router.push("/");
      } else {
        setError(data.error || "Authentication failed. Check your password.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, label: "Track private metrics" },
    { icon: Moon, label: "Sleep and energy insights" },
    { icon: Zap, label: "Pattern correlations" },
    { icon: Sparkles, label: "Google Calendar and Tasks" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-16 overflow-hidden">
        {/* Background Image with modern filters */}
        <div className="absolute inset-0 z-0">
          <img src="/images/login_banner.png" alt="Productivity banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-teal-900/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-teal-950/80 via-transparent to-teal-950/90" />
        </div>

        <div className="relative z-10 text-center text-white space-y-10 max-w-md">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-md border border-white/20">
              <Flame className="h-8 w-8 fill-current text-white animate-pulse" />
            </div>
            <span className="text-4xl font-black tracking-tight">LifeOS</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">Private Life Analytics</h1>
            <p className="text-teal-50/90 text-sm leading-relaxed">
              Your LifeOS data is securely stored in Supabase. Google receives only the tasks and events you explicitly sync.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs text-white/90 font-medium">{feature.label}</span>
                </div>
              );
            })}
          </div>

          <p className="text-teal-100/60 text-xs">Supabase vault · User-consented Google sync · Secure API routes</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500">
            <Flame className="h-6 w-6 fill-current text-white" />
          </div>
          <span className="text-2xl font-black text-slate-800">LifeOS</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-200">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Unlock LifeOS</h2>
            <p className="text-slate-500 text-sm">
              Enter your password to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
                className="h-12 bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus-visible:ring-teal-400 focus-visible:border-teal-400 shadow-sm rounded-xl"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                <span className="mt-0.5 flex-shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold cursor-pointer rounded-xl shadow-md shadow-teal-500/25 text-base">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Unlock Dashboard"
              )}
            </Button>
          </form>

          <p className="text-xs text-slate-400 text-center">
            Password verified against your Supabase vault. No session data is stored in this browser.
          </p>
        </div>
      </div>
    </div>
  );
}
