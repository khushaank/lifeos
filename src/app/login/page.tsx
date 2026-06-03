"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Loader2, Lock, Moon, Sparkles, TrendingUp, Zap, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { saveGoogleClientId, getStoredGoogleClientId } from "@/lib/google";

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
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(getStoredGoogleClientId());
  const [googleSaved, setGoogleSaved] = useState(false);
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

  const handleSaveGoogleId = () => {
    if (googleClientId.trim()) {
      saveGoogleClientId(googleClientId.trim());
      setGoogleSaved(true);
      setTimeout(() => setGoogleSaved(false), 3000);
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
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-16 bg-teal-600">
        <div className="text-center text-white space-y-10 max-w-md">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg">
              <Flame className="h-8 w-8 fill-current text-white" />
            </div>
            <span className="text-4xl font-black tracking-tight">LifeOS</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">Private Life Analytics</h1>
            <p className="text-teal-50 text-base leading-relaxed">
              Your LifeOS data is securely stored in Supabase. Google receives only the tasks and events you explicitly sync.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/90 font-medium">{feature.label}</span>
                </div>
              );
            })}
          </div>

          <p className="text-teal-100/80 text-xs">Supabase vault · User-consented Google sync · Secure API routes</p>
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

          {/* Google Client ID Setup Section */}
          <div className="border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => setShowGoogleSetup(!showGoogleSetup)}
              className="flex items-center justify-between w-full text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 ring-1 ring-sky-200">
                  <CalendarDays className="h-4 w-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Google Calendar & Tasks</p>
                  <p className="text-[11px] text-slate-400">Paste your OAuth Client ID to enable sync</p>
                </div>
              </div>
              {showGoogleSetup ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showGoogleSetup && (
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="google-client-id" className="text-slate-700 font-semibold text-sm">
                    Google OAuth Client ID
                  </Label>
                  <Input
                    id="google-client-id"
                    type="text"
                    value={googleClientId}
                    onChange={(event) => setGoogleClientId(event.target.value)}
                    placeholder="123456789-abc.apps.googleusercontent.com"
                    className="h-11 bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus-visible:ring-sky-400 focus-visible:border-sky-400 shadow-sm rounded-xl text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleSaveGoogleId}
                    disabled={!googleClientId.trim()}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-semibold cursor-pointer rounded-xl h-10 text-sm"
                  >
                    Save Client ID
                  </Button>
                  {googleSaved && (
                    <span className="text-xs text-emerald-600 font-medium">✓ Saved to this browser</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Create an OAuth 2.0 Client ID in the{" "}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                    Google Cloud Console
                  </a>
                  . Enable Google Calendar API and Google Tasks API. Add your site URL as an authorized JavaScript origin.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 text-center">
            Password verified against your Supabase vault. No data is stored in this browser.
          </p>
        </div>
      </div>
    </div>
  );
}
