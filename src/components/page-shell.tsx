"use client";

import { Navigation } from "@/components/navigation";
import { useLifeStore } from "@/store/useLifeStore";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
  maxWidth?: "3xl" | "5xl" | "7xl";
};

export function PageShell({
  children,
  className,
  mainClassName,
  maxWidth = "7xl",
}: PageShellProps) {
  const isSidebarCollapsed = useLifeStore((state) => state.isSidebarCollapsed);

  const maxClass = {
    "3xl": "max-w-3xl",
    "5xl": "max-w-5xl",
    "7xl": "max-w-7xl",
  }[maxWidth];

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground font-sans pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:pl-[4.25rem]" : "md:pl-56",
        className
      )}
    >
      <Navigation />
      <main className={cn("mx-auto px-4 py-6 md:px-8", maxClass, mainClassName)}>{children}</main>
    </div>
  );
}
