import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { passwordHash } = await request.json();
    if (!passwordHash || passwordHash.length !== 64) {
      return NextResponse.json({ error: "Invalid password hash" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({
        key: "admin_password_hash",
        value: passwordHash,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update password:", err);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
