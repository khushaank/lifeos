import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api-json";
import { isMissingTableError, isRlsError } from "@/lib/supabase-errors";

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    template_id: row.template_id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    track_type: row.track_type as string,
    daily_prompt: row.daily_prompt as string,
    started_at: row.started_at as string,
    ends_at: row.ends_at as string,
    notify_enabled: Boolean(row.notify_enabled),
    notify_hour: Number(row.notify_hour ?? 20),
    responses: (row.responses as Record<string, boolean>) || {},
  };
}

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("life_experiments")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error) || isRlsError(error)) {
        console.warn("life_experiments unavailable:", error);
        return NextResponse.json([]);
      }
      throw error;
    }
    return NextResponse.json((data || []).map(mapRow));
  } catch (err) {
    console.error("Failed to fetch experiments:", err);
    if (isMissingTableError(err)) return NextResponse.json([]);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exp = await parseJsonBody(request);
    if (!exp?.id || !exp.title || !exp.started_at || !exp.ends_at) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("life_experiments").upsert({
      id: exp.id as string,
      template_id: exp.template_id as string,
      title: exp.title as string,
      description: (exp.description as string) || "",
      track_type: exp.track_type as string,
      daily_prompt: exp.daily_prompt as string,
      started_at: exp.started_at as string,
      ends_at: exp.ends_at as string,
      notify_enabled: exp.notify_enabled ?? true,
      notify_hour: exp.notify_hour ?? 20,
      responses: exp.responses || {},
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          {
            error:
              "Table life_experiments missing. Run supabase/fix_rls_and_tables.sql in Supabase SQL Editor.",
          },
          { status: 503 }
        );
      }
      if (isRlsError(error)) {
        return NextResponse.json(
          {
            error:
              "RLS blocked experiment save. Run supabase/fix_rls_and_tables.sql in Supabase SQL Editor.",
          },
          { status: 503 }
        );
      }
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save experiment:", err);
    if (isMissingTableError(err) || isRlsError(err)) {
      return NextResponse.json(
        { error: "Run supabase/fix_rls_and_tables.sql in Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to save experiment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("life_experiments").delete().eq("id", id);
    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ success: true });
      }
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete experiment:", err);
    return NextResponse.json({ error: "Failed to delete experiment" }, { status: 500 });
  }
}
