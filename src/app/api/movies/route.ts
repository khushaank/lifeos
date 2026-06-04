import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api-json";

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    watched_date: row.watched_date as string,
    title: row.title as string,
    rating: Number(row.rating),
    notes: (row.notes as string) || "",
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from("movie_log")
      .select("*")
      .order("rating", { ascending: false })
      .order("watched_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json((data || []).map(mapRow));
  } catch (err) {
    console.error("Failed to fetch movies:", err);
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await parseJsonBody(request);
    if (!body?.id || !body.title || !body.watched_date || body.rating == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("movie_log").upsert({
      id: body.id,
      watched_date: body.watched_date,
      title: body.title,
      rating: body.rating,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save movie:", err);
    return NextResponse.json({ error: "Failed to save movie" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("movie_log").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete movie:", err);
    return NextResponse.json({ error: "Failed to delete movie" }, { status: 500 });
  }
}
