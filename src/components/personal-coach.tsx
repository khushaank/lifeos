"use client";

import { useMemo } from "react";
import type { LogEntry } from "@/store/useLifeStore";
import { generateCoachMessages } from "@/lib/coach";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

type Props = {
  entries: LogEntry[];
  compact?: boolean;
};

export function PersonalCoach({ entries, compact }: Props) {
  const messages = useMemo(() => generateCoachMessages(entries), [entries]);

  return (
    <Card className="border-border rounded-2xl shadow-sm">
      <CardHeader className={cn("pb-2", compact && "py-4")}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
            <MessageCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Personal coach</CardTitle>
            <CardDescription className="text-xs">Patterns from your check-ins</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-xl border px-3.5 py-3 text-sm leading-relaxed",
              msg.tone === "positive" &&
                "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30",
              msg.tone === "caution" &&
                "border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30",
              msg.tone === "neutral" && "border-border bg-muted/30"
            )}
          >
            <span className="mr-1.5" aria-hidden>
              {msg.tone === "positive" ? ":)" : msg.tone === "caution" ? ":|" : ":)"}
            </span>
            {msg.text}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
