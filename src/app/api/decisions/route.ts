import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api-json";

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    decision_date: row.decision_date as string,
    title: row.title as string,
    situation: (row.situation as string) || "",
    options_considered: (row.options_considered as string) || "",
    decision_made: row.decision_made as string,
    reasoning: (row.reasoning as string) || "",
    expected_outcome: (row.expected_outcome as string) || "",
    actual_outcome: (row.actual_outcome as string) || "",
    confidence: row.confidence != null ? Number(row.confidence) : 5,
    outcome_rating: row.outcome_rating != null ? Number(row.outcome_rating) : null,
    tags: (row.tags as string) || "",
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("decision_journal")
      .select("*")
      .order("decision_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json((data || []).map(mapRow));
  } catch (err) {
    console.error("Failed to fetch decisions:", err);
    return NextResponse.json({ error: "Failed to fetch decisions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseJsonBody(request);
    if (!body?.id || !body.title || !body.decision_made || !body.decision_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("decision_journal").upsert({
      id: body.id,
      decision_date: body.decision_date,
      title: body.title,
      situation: body.situation || null,
      options_considered: body.options_considered || null,
      decision_made: body.decision_made,
      reasoning: body.reasoning || null,
      expected_outcome: body.expected_outcome || null,
      actual_outcome: body.actual_outcome || null,
      confidence: body.confidence ?? 5,
      outcome_rating: body.outcome_rating ?? null,
      tags: body.tags || null,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save decision:", err);
    return NextResponse.json({ error: "Failed to save decision" }, { status: 500 });
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
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("decision_journal").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete decision:", err);
    return NextResponse.json({ error: "Failed to delete decision" }, { status: 500 });
  }
}
