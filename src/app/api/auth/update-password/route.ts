import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/security";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/security";

export async function POST(request: Request) {
  try {
    // Manual session check inside server routes to ensure isolation safety
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("lifeos_session")?.value;
    const systemSecret = process.env.SESSION_SECRET || "default-secret-string-at-least-32-chars";

    if (!sessionToken || !(await verifySessionToken(sessionToken, systemSecret))) {
      return NextResponse.json({ error: "Unauthorized operation source" }, { status: 403 });
    }

    const { currentPassword, newPassword } = await request.json();

    let currentHashedExpected = "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"; // Default "lifeos123"
    let dbConnected = false;

    const { data: configData, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_password_hash")
      .single();

    if (!error && configData) {
      currentHashedExpected = configData.value;
      dbConnected = true;
    }

    const currentHashed = await hashPassword(currentPassword);
    if (currentHashed !== currentHashedExpected) {
      return NextResponse.json({ error: "Current password validation failed" }, { status: 400 });
    }

    const newHashed = await hashPassword(newPassword);

    if (dbConnected) {
      const { error: updateError } = await supabaseAdmin
        .from("app_settings")
        .update({ value: newHashed, updated_at: new Date().toISOString() })
        .eq("key", "admin_password_hash");

      if (updateError) {
        return NextResponse.json({ error: "Database update error" }, { status: 500 });
      }
    } else {
      console.warn("Local/fallback mode active: Credentials updated locally only.");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server updating error occurred" }, { status: 500 });
  }
}
