import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { passwordHash } = await request.json();
    if (!passwordHash) {
      return NextResponse.json({ error: "Password hash required" }, { status: 400 });
    }

    // Fetch stored password hash
    let { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_password_hash")
      .maybeSingle();

    let storedHash = data?.value;

    const defaultHash = "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5";
    if (error || !storedHash) {
      await supabaseAdmin
        .from("app_settings")
        .insert({ key: "admin_password_hash", value: defaultHash })
        .select()
        .maybeSingle();
      storedHash = defaultHash;
    }

    if (passwordHash !== storedHash) {
      return NextResponse.json({ error: "Access key does not match this browser vault" }, { status: 401 });
    }

    const sessionToken = crypto.randomUUID();

    const { error: upsertError } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "session_token", value: sessionToken, updated_at: new Date().toISOString() });

    if (upsertError) {
      console.error("Failed to store session token:", upsertError);
      return NextResponse.json({ error: "Database error during login" }, { status: 500 });
    }

    await setSessionCookie(sessionToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
