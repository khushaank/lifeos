import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await supabaseAdmin
      .from("app_settings")
      .delete()
      .eq("key", "session_token");

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
