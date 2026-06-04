import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api-json";
import { isRlsError } from "@/lib/supabase-errors";
import {
  resolveFocusTimer,
  todayDateString,
  type FocusTimerPayload,
  type TimerStatus,
} from "@/lib/focus-timer";

const ROW_ID = "default";

function defaultTimerResponse() {
  const today = todayDateString();
  return resolveFocusTimer({
    selected_minutes: 25,
    status: "idle",
    ends_at: null,
    remaining_seconds: 1500,
    sessions_completed_date: today,
    sessions_completed_count: 0,
  });
}

function rowToPayload(row: Record<string, unknown>): FocusTimerPayload {
  return {
    selected_minutes: Number(row.selected_minutes) || 25,
    status: (row.status as TimerStatus) || "idle",
    ends_at: (row.ends_at as string) || null,
    remaining_seconds: Number(row.remaining_seconds) || 1500,
    sessions_completed_date: (row.sessions_completed_date as string) || null,
    sessions_completed_count: Number(row.sessions_completed_count) || 0,
    updated_at: (row.updated_at as string) || undefined,
  };
}

async function persistCompletedSession(plannedMinutes: number, actualSeconds: number) {
  const { error } = await supabaseAdmin.from("focus_sessions").insert({
    planned_minutes: plannedMinutes,
    actual_seconds: actualSeconds,
  });
  if (error) {
    // Table is optional until migration is applied
    console.warn("focus_sessions insert skipped:", error.message);
  }
}

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("focus_timer_state")
      .select("*")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const { error: insertError } = await supabaseAdmin.from("focus_timer_state").insert({ id: ROW_ID });
      if (insertError) {
        if (isRlsError(insertError)) {
          console.warn("focus_timer_state RLS — run supabase/fix_rls_and_tables.sql");
          return NextResponse.json(defaultTimerResponse());
        }
        throw insertError;
      }
      return NextResponse.json(defaultTimerResponse());
    }

    const raw = rowToPayload(data);
    const wasRunning = raw.status === "running";
    const resolved = resolveFocusTimer(raw);

    if (wasRunning && resolved.status === "completed") {
      const today = todayDateString();
      const count =
        raw.sessions_completed_date === today ? raw.sessions_completed_count + 1 : 1;

      await supabaseAdmin
        .from("focus_timer_state")
        .update({
          status: "completed",
          ends_at: null,
          remaining_seconds: 0,
          sessions_completed_date: today,
          sessions_completed_count: count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ROW_ID);

      await persistCompletedSession(raw.selected_minutes, raw.selected_minutes * 60);

      return NextResponse.json({
        ...resolved,
        status: "completed" as const,
        remainingSeconds: 0,
        sessionsCompletedDate: today,
        sessionsCompletedCount: count,
      });
    }

    return NextResponse.json(resolved);
  } catch (err) {
    console.error("Failed to fetch focus timer:", err);
    if (isRlsError(err)) {
      return NextResponse.json(defaultTimerResponse());
    }
    return NextResponse.json(defaultTimerResponse());
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseJsonBody<{
      status?: TimerStatus;
      ends_at?: string | null;
      remaining_seconds?: number;
      selected_minutes?: number;
      sessions_completed_date?: string;
      sessions_completed_count?: number;
    }>(request);
    if (!body) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }
    const today = todayDateString();

    let sessionsDate = body.sessions_completed_date ?? today;
    let sessionsCount = Number(body.sessions_completed_count) || 0;
    if (sessionsDate !== today) {
      sessionsDate = today;
      sessionsCount = 0;
    }

    const status = (body.status ?? "idle") as TimerStatus;
    let endsAt: string | null =
      typeof body.ends_at === "string" ? body.ends_at : null;
    let remainingSeconds = Number(body.remaining_seconds) || 0;
    const selectedMinutes = Number(body.selected_minutes) || 25;

    if (status === "running" && endsAt) {
      const left = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
      remainingSeconds = left;
      if (left <= 0) {
        endsAt = null;
        remainingSeconds = 0;
      }
    }

    const finalStatus: TimerStatus =
      status === "running" && remainingSeconds <= 0 ? "completed" : status;

    if (finalStatus === "completed" && status !== "completed") {
      sessionsCount += 1;
      await persistCompletedSession(selectedMinutes, selectedMinutes * 60);
    }

    const row = {
      id: ROW_ID,
      selected_minutes: selectedMinutes,
      status: finalStatus,
      ends_at: finalStatus === "running" ? endsAt : null,
      remaining_seconds:
        finalStatus === "running"
          ? remainingSeconds
          : finalStatus === "completed"
            ? 0
            : remainingSeconds,
      sessions_completed_date: sessionsDate,
      sessions_completed_count: sessionsCount,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from("focus_timer_state").upsert(row, { onConflict: "id" });
    if (error) {
      if (isRlsError(error)) {
        return NextResponse.json(
          {
            error:
              "Database RLS blocked focus timer. Run supabase/fix_rls_and_tables.sql in Supabase.",
          },
          { status: 503 }
        );
      }
      throw error;
    }

    const resolved = resolveFocusTimer(rowToPayload(row));
    return NextResponse.json(resolved);
  } catch (err) {
    console.error("Failed to save focus timer:", err);
    if (isRlsError(err)) {
      return NextResponse.json(
        { error: "Run supabase/fix_rls_and_tables.sql to fix focus timer permissions." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to save focus timer" }, { status: 500 });
  }
}
