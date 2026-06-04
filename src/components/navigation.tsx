"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  BrainCircuit,
  Briefcase,
  Store,
  LogOut,
  CalendarDays,
  Menu,
  Flame,
  Timer,
  Scale,
  Target,
  Film,
  MoreHorizontal,
  X,
  Search,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { CommandPaletteTrigger } from "@/components/command-palette";
import { useLifeStore } from "@/store/useLifeStore";
import { cn } from "@/lib/utils";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

type NavItem = {
  name: string;
  shortName: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: boolean;
};

function NavLink({
  item,
  active,
  expanded,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const router = useRouter();

  return (
    <Link
      href={item.href}
      prefetch
      onMouseEnter={() => router.prefetch(item.href)}
      onClick={onNavigate}
      title={!expanded ? item.name : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium transition-colors cursor-pointer",
        expanded ? "px-2.5" : "justify-center px-0 mx-0.5",
        active
          ? "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-teal-600 dark:text-teal-400")} />
      {expanded && (
        <span className="truncate flex-1 flex items-center gap-1.5 min-w-0">
          {item.name}
          {item.badge && <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />}
        </span>
      )}
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const setAuthenticated = useLifeStore((state) => state.setAuthenticated);
  const entries = useLifeStore((state) => state.entries);
  const isSidebarCollapsed = useLifeStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useLifeStore((state) => state.setSidebarCollapsed);

  const [isHovered, setIsHovered] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  const checkedInToday = entries.some((e) => e.date === todayString());

  const coreNav: NavItem[] = [
    { name: "Dashboard", shortName: "Home", href: "/", icon: LayoutDashboard },
    {
      name: checkedInToday ? "Update Check-In" : "Check In",
      shortName: "Check In",
      href: "/check-in",
      icon: CheckSquare,
      badge: checkedInToday,
    },
    { name: "Planner", shortName: "Planner", href: "/planner", icon: CalendarDays },
    { name: "Focus", shortName: "Focus", href: "/focus", icon: Timer },
    { name: "Insights", shortName: "Insights", href: "/insights", icon: BrainCircuit },
  ];

  const goalsNav: NavItem = { name: "Goals", shortName: "Goals", href: "/goals", icon: Target };
  const kpiNav: NavItem = { name: "KPI Board", shortName: "KPI", href: "/kpi", icon: Briefcase };
  const experimentsNav: NavItem = {
    name: "Experiments",
    shortName: "Store",
    href: "/experiments",
    icon: Store,
  };

  const mainNav: NavItem[] = [...coreNav, kpiNav, goalsNav];

  const logsNav: NavItem[] = [
    { name: "Decision Journal", shortName: "Journal", href: "/journal", icon: Scale },
    { name: "Missed Opportunities", shortName: "Missed", href: "/opportunities", icon: Target },
    { name: "Movies", shortName: "Movies", href: "/movies", icon: Film },
    { name: "Books Library", shortName: "Books", href: "/books", icon: BookOpen },
  ];

  const otherNav: NavItem[] = [{ name: "WWHD", shortName: "WWHD", href: "/wwhd", icon: Flame }];

  const allItems = [...mainNav, ...logsNav, ...otherNav];
  const mobilePrimary = coreNav;
  const mobileMore = [goalsNav, kpiNav, experimentsNav, ...logsNav, ...otherNav];

  const handleLogout = () => {
    setMobileMoreOpen(false);
    setAuthenticated(false);
    router.push("/login");
  };

  const isVisuallyExpanded = !isSidebarCollapsed || isHovered;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const logsActive = logsNav.some((i) => isActive(i.href));

  return (
    <>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 hidden flex-col border-r border-border bg-card z-30 transition-all duration-300 ease-in-out md:flex overflow-hidden",
          isVisuallyExpanded ? "w-56 px-3 py-4" : "w-[4.25rem] px-2 py-4"
        )}
      >
        <div className={cn("flex items-center gap-2 mb-3 shrink-0", !isVisuallyExpanded && "justify-center")}>
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 dark:text-teal-400 cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "Expand" : "Collapse"}
          >
            <Menu className="h-4 w-4" />
          </button>
          {isVisuallyExpanded && <span className="text-lg font-bold tracking-tight truncate">LifeOS</span>}
        </div>

        {isVisuallyExpanded ? (
          <div className="mb-3 shrink-0">
            <CommandPaletteTrigger />
          </div>
        ) : (
          <button
            type="button"
            title="Search (Ctrl+K)"
            onClick={() => window.dispatchEvent(new Event("lifeos:open-search"))}
            className="mx-auto mb-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 hover:bg-muted cursor-pointer"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-1 flex-col min-h-0 gap-0.5 overflow-hidden">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} expanded={isVisuallyExpanded} />
          ))}

          {isVisuallyExpanded ? (
            <div className="mt-2 pt-2 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setLogsOpen((o) => !o)}
                className={cn(
                  "flex w-full items-center justify-between gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer",
                  logsActive ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Logs
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", logsOpen && "rotate-180")} />
              </button>
              {logsOpen && (
                <div className="mt-0.5 space-y-0.5 pl-1">
                  {logsNav.map((item) => (
                    <NavLink key={item.href} item={item} active={isActive(item.href)} expanded />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-border space-y-0.5">
              {logsNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} expanded={false} />
              ))}
            </div>
          )}

          <div className="mt-auto pt-2 border-t border-border space-y-0.5 shrink-0">
            {otherNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} expanded={isVisuallyExpanded} />
            ))}
            <button
              onClick={handleLogout}
              title={!isVisuallyExpanded ? "Logout" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer",
                isVisuallyExpanded ? "px-2.5" : "justify-center"
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {isVisuallyExpanded && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-14 items-stretch">
          {mobilePrimary.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] cursor-pointer",
                  active ? "text-teal-600 dark:text-teal-400 font-semibold" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate max-w-[3.5rem]">{item.shortName}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMoreOpen(true)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] cursor-pointer",
              mobileMore.some((i) => isActive(i.href)) || mobileMoreOpen
                ? "text-teal-600 font-semibold"
                : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {mobileMoreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setMobileMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <p className="text-sm font-bold">More</p>
              <button type="button" onClick={() => setMobileMoreOpen(false)} className="h-8 w-8 rounded-lg hover:bg-muted cursor-pointer flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMoreOpen(false);
                window.dispatchEvent(new Event("lifeos:open-search"));
              }}
              className="w-full mb-3 shrink-0 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-sm font-medium cursor-pointer"
            >
              <Search className="h-4 w-4" />
              Search
              <kbd className="text-[10px] font-mono border border-border rounded px-1">Ctrl K</kbd>
            </button>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto min-h-0">
              {mobileMore.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={() => setMobileMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[10px] font-medium cursor-pointer",
                      active
                        ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.shortName}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[10px] font-medium text-rose-600 cursor-pointer dark:border-rose-900/50 dark:bg-rose-950/30"
              >
                <LogOut className="h-5 w-5" />
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
