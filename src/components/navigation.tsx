"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CheckSquare, BrainCircuit, Settings, LogOut, Flame } from "lucide-react";
import { useLifeStore } from "@/store/useLifeStore";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const setAuthenticated = useLifeStore((state) => state.setAuthenticated);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Check In", href: "/check-in", icon: CheckSquare },
    { name: "Insights", href: "/insights", icon: BrainCircuit },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setAuthenticated(false);
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-6 py-8 md:flex shadow-sm z-30">
        <div className="flex items-center gap-2.5 px-2 pb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">LifeOS</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-teal-50 text-teal-600 border-l-4 border-teal-500 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-teal-500" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 md:hidden shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 text-xs transition-colors cursor-pointer",
                isActive ? "text-teal-600 font-semibold" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-xs text-rose-600 cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span>Exit</span>
        </button>
      </nav>
    </>
  );
}
