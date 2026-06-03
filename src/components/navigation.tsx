"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CheckSquare, BrainCircuit, LogOut, CalendarDays, Menu, Flame } from "lucide-react";
import { useLifeStore } from "@/store/useLifeStore";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const setAuthenticated = useLifeStore((state) => state.setAuthenticated);
  const isSidebarCollapsed = useLifeStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useLifeStore((state) => state.setSidebarCollapsed);

  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Check In", href: "/check-in", icon: CheckSquare },
    { name: "Planner", href: "/planner", icon: CalendarDays },
    { name: "Insights", href: "/insights", icon: BrainCircuit },
    { name: "WWHD", href: "/wwhd", icon: Flame },
  ];

  const handleLogout = () => {
    setAuthenticated(false);
    router.push("/login");
  };

  const isVisuallyExpanded = !isSidebarCollapsed || isHovered;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 hidden flex-col border-r border-slate-200 bg-white py-8 shadow-sm z-30 transition-all duration-300 ease-in-out md:flex",
          isVisuallyExpanded ? "w-64 px-6 shadow-md" : "w-20 px-3"
        )}
      >
        <div className={cn("flex items-center gap-2.5 px-2 pb-8", !isVisuallyExpanded && "justify-center px-0")}>
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-600 transition-colors flex-shrink-0 cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
          {isVisuallyExpanded && <span className="text-xl font-bold tracking-tight text-slate-800">LifeOS</span>}
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!isVisuallyExpanded ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl py-3.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                  !isVisuallyExpanded ? "justify-center px-0 mx-1" : "px-4",
                  isActive
                    ? "bg-teal-50 text-teal-600 border-l-4 border-teal-500 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-teal-500" : "text-slate-400")} />
                {isVisuallyExpanded && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          title={!isVisuallyExpanded ? "Logout" : undefined}
          className={cn(
            "mt-auto flex items-center gap-3 rounded-xl py-3.5 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700 cursor-pointer",
            !isVisuallyExpanded ? "justify-center px-0 mx-1" : "px-4"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isVisuallyExpanded && <span>Logout</span>}
        </button>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 md:hidden shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
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
