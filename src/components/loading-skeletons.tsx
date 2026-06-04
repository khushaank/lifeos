import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-muted/60 animate-pulse", className)} />;
}

export function DashboardHeroSkeleton() {
  return (
    <div className="rounded-3xl border border-border p-8 space-y-4">
      <Bone className="h-4 w-32" />
      <Bone className="h-8 w-56" />
      <Bone className="h-4 w-40" />
    </div>
  );
}

export function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-border p-4 space-y-2">
          <Bone className="h-3 w-20" />
          <Bone className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border p-5 space-y-3">
      <Bone className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <Bone key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-5 space-y-4">
      <Bone className="h-5 w-48" />
      <Bone className="h-3 w-full max-w-md" />
      <div className="flex gap-1 overflow-hidden">
        {Array.from({ length: 52 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, j) => (
              <Bone key={j} className="h-3 w-3 rounded-[2px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-5 space-y-3">
      <Bone className="h-5 w-36" />
      <Bone className="h-14 w-full" />
      <Bone className="h-14 w-full" />
      <Bone className="h-14 w-full" />
    </div>
  );
}

export function GoalsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
          <Bone className="h-5 w-48" />
          <Bone className="h-2 w-full" />
          <Bone className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
