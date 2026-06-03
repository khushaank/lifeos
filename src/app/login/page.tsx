"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Loader2, Lock, Moon, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginPage() {
  const [accessKey, setAccessKey] = useState("");
  const [confirmKey, setConfirmKey] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuthenticated = useLifeStore((state) => state.setAuthenticated);

  useEffect(() => {
    const id = window.setTimeout(() => setHasKey(Boolean(localStorage.getItem("lifeos-access-key"))), 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const hashedAccessKey = await hashKey(accessKey);
      const savedKey = localStorage.getItem("lifeos-access-key");

      if (!savedKey) {
        if (accessKey.length < 8) {
          setError("Create an access key with at least 8 characters.");
          setLoading(false);
          return;
        }
        if (accessKey !== confirmKey) {
          setError("The confirmation key does not match.");
          setLoading(false);
          return;
        }
        localStorage.setItem("lifeos-access-key", hashedAccessKey);
        setAuthenticated(true);
        router.push("/");
        return;
      }

      const isHashed = savedKey.length === 64 && /^[0-9a-f]+$/i.test(savedKey);

      if (isHashed) {
        if (savedKey === hashedAccessKey) {
          setAuthenticated(true);
          router.push("/");
        } else {
          setError("Access key does not match this browser vault.");
        }
      } else {
        // Backward compatibility: upgrade plaintext to hashed key on match
        if (savedKey === accessKey) {
          localStorage.setItem("lifeos-access-key", hashedAccessKey);
          setAuthenticated(true);
          router.push("/");
        } else {
          setError("Access key does not match this browser vault.");
        }
      }
    } catch (err) {
      setError("An error occurred during vault security check.");
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
              Your LifeOS data stays in this browser. Google receives only the tasks and events you explicitly sync.
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

          <p className="text-teal-100/80 text-xs">Local vault · User-consented Google sync · Static-host friendly</p>
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
              {hasKey ? <Lock className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{hasKey === false ? "Create Private Key" : "Unlock LifeOS"}</h2>
            <p className="text-slate-500 text-sm">
              {hasKey === false ? "First run: create a key for this browser vault." : "Enter your local access key to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="access-key" className="text-slate-700 font-semibold text-sm">
                Access Key
              </Label>
              <Input
                id="access-key"
                type="password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                placeholder={hasKey === false ? "Create at least 8 characters" : "Enter your key"}
                required
                autoFocus
                className="h-12 bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus-visible:ring-teal-400 focus-visible:border-teal-400 shadow-sm rounded-xl"
              />
            </div>

            {hasKey === false && (
              <div className="space-y-2">
                <Label htmlFor="confirm-key" className="text-slate-700 font-semibold text-sm">
                  Confirm Key
                </Label>
                <Input
                  id="confirm-key"
                  type="password"
                  value={confirmKey}
                  onChange={(event) => setConfirmKey(event.target.value)}
                  placeholder="Repeat your key"
                  required
                  className="h-12 bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus-visible:ring-teal-400 focus-visible:border-teal-400 shadow-sm rounded-xl"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                <span className="mt-0.5 flex-shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold cursor-pointer rounded-xl shadow-md shadow-teal-500/25 text-base">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {hasKey === false ? "Creating..." : "Unlocking..."}
                </>
              ) : hasKey === false ? (
                "Create Private Vault"
              ) : (
                "Unlock Dashboard"
              )}
            </Button>
          </form>

          <p className="text-xs text-slate-400 text-center">
            No default password. No server session. This lock protects the local browser vault for your GitHub Pages deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
