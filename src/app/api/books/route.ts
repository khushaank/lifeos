import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api-json";

function mapRow(row: Record<string, any>) {
  return {
    id: row.id as string,
    title: row.title as string,
    author: row.author as string || "",
    total_pages: Number(row.total_pages),
    current_page: Number(row.current_page || 0),
    completed: Boolean(row.completed),
    notes: row.notes as string || "",
    cover_url: (row.cover_url as string) || undefined,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function GET(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q");

    let query = supabaseAdmin.from("books").select("*");

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query
      .order("completed", { ascending: true })
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json((data || []).map(mapRow));
  } catch (err) {
    console.error("Failed to fetch books:", err);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseJsonBody(request);
    if (!body || !body.title || body.total_pages == null) {
      return NextResponse.json({ error: "Title and total pages are required" }, { status: 400 });
    }

    const bookData: Record<string, unknown> = {
      title: body.title,
      author: body.author || null,
      total_pages: Number(body.total_pages),
      current_page: Number(body.current_page || 0),
      completed: Boolean(body.completed || false),
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    // Only set cover_url if it was explicitly provided in the payload
    if ("cover_url" in body) {
      bookData.cover_url = body.cover_url || null;
    }

    let result;
    if (body.id) {
      const { data, error } = await supabaseAdmin
        .from("books")
        .upsert({ id: body.id, ...bookData })
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("books")
        .insert(bookData)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json(mapRow(result));
  } catch (err) {
    console.error("Failed to save book:", err);
    return NextResponse.json({ error: "Failed to save book" }, { status: 500 });
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

    const { error } = await supabaseAdmin
      .from("books")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete book:", err);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
