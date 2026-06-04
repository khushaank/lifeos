"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { Loader2 } from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { ExperimentNotifications } from "@/components/experiment-notifications";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useLifeStore((state) => state.isAuthenticated);
  const setAuthenticated = useLifeStore((state) => state.setAuthenticated);
  const [checking, setChecking] = useState(true);

  // Verify session cookie against Supabase on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/verify");
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          void useLifeStore.getState().syncAll({ force: true, silent: false });
          void useLifeStore.getState().fetchFocusTimer();
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, [setAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    const normalizedPathname = pathname.replace(/\/$/, "");
    if (checking || normalizedPathname === "/login") return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, checking, router]);

  const normalizedPathname = pathname.replace(/\/$/, "");
  if (normalizedPathname === "/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
          <span>Redirecting to login...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <CommandPalette />
      <ExperimentNotifications />
      {children}
    </>
  );
}
