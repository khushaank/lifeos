"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLifeStore } from "@/store/useLifeStore";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useLifeStore((state) => state.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const normalizedPathname = pathname.replace(/\/$/, "");
    if (!ready || normalizedPathname === "/login") return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, ready, router]);

  const normalizedPathname = pathname.replace(/\/$/, "");
  if (normalizedPathname === "/login") return <>{children}</>;

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-500">
        Locked. Redirecting to LifeOS access.
      </div>
    );
  }

  return <>{children}</>;
}
