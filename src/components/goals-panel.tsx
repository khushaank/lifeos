"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLifeStore, type LifeGoal } from "@/store/useLifeStore";
import { enrichGoalsWithProgress } from "@/lib/goal-progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";

function daysUntil(deadline?: string | null) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (86400000));
}

function GoalRow({ goal }: { goal: LifeGoal }) {
  const days = daysUntil(goal.deadline);
  const overdue = days !== null && days < 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-2 text-xs font-medium">
        <span className="text-muted-foreground truncate">{goal.title}</span>
        <span className="font-bold shrink-0">{goal.progress}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className={cn(goal.color, "h-1.5 rounded-full transition-all duration-700")}
          style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {goal.target}
        {goal.metric && goal.metric !== "custom" && goal.current_value != null && (
          <> · {goal.current_value}{goal.unit ? ` ${goal.unit}` : ""}</>
        )}
        {days !== null && (
          <span className={cn(overdue && "text-rose-600 dark:text-rose-400")}>
            {" "}
            · {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "due today" : `${days}d left`}
          </span>
        )}
      </p>
    </div>
  );
}

function GoalsPanel({ limit = 4 }: { limit?: number }) {
  const goals = useLifeStore((s) => s.goals);
  const entries = useLifeStore((s) => s.entries);

  const enriched = useMemo(() => enrichGoalsWithProgress(goals, entries), [goals, entries]);
  const shown = enriched.slice(0, limit);

  return (
    <Card className="bg-card border-border shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-600" />
            Goals
          </CardTitle>
          <CardDescription className="text-xs">Progress from your logs</CardDescription>
        </div>
        <Link href="/goals" className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center font-semibold">
          Change <ChevronRight className="h-3 w-3 ml-0.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No goals yet.</p>
        ) : (
          shown.map((goal) => <GoalRow key={goal.id} goal={goal} />)
        )}
        <Link href="/goals">
          <Button variant="outline" size="sm" className="w-full text-xs cursor-pointer">
            Change goals
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export { GoalsPanel };
export default GoalsPanel;
