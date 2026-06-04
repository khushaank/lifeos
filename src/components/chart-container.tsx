"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  height: number;
  children: ReactNode;
  className?: string;
};

/** Defer Recharts until after mount so ResponsiveContainer gets real dimensions */
export function ChartContainer({ height, children, className }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={className ?? "w-full min-w-0"}
      style={{ height, minHeight: height }}
    >
      {ready ? (
        children
      ) : (
        <div className="h-full w-full rounded-lg bg-muted/30 animate-pulse" />
      )}
    </div>
  );
}
