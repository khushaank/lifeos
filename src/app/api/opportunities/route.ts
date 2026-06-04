import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api-json";

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    opportunity_date: row.opportunity_date as string,
    title: row.title as string,
    description: (row.description as string) || "",
    why_missed: (row.why_missed as string) || "",
    lesson_learned: (row.lesson_learned as string) || "",
    regret_level: row.regret_level != null ? Number(row.regret_level) : 5,
    tags: (row.tags as string) || "",
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from("missed_opportunities")
      .select("*")
      .order("opportunity_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json((data || []).map(mapRow));
  } catch (err) {
    console.error("Failed to fetch opportunities:", err);
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await parseJsonBody(request);
    if (!body?.id || !body.title || !body.opportunity_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("missed_opportunities").upsert({
      id: body.id,
      opportunity_date: body.opportunity_date,
      title: body.title,
      description: body.description || null,
      why_missed: body.why_missed || null,
      lesson_learned: body.lesson_learned || null,
      regret_level: body.regret_level ?? 5,
      tags: body.tags || null,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save opportunity:", err);
    return NextResponse.json({ error: "Failed to save opportunity" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("missed_opportunities").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete opportunity:", err);
    return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 });
  }
}
