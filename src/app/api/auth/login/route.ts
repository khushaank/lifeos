import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, signSessionToken } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password entry required" }, { status: 400 });
    }

    // Retrieve hashed password configuration
    let adminHash = "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"; // Default "lifeos123"

    const { data: configData, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_password_hash")
      .single();

    if (error || !configData) {
      console.warn("Could not retrieve password hash from database, falling back to default key:", error?.message || "No config data");
    } else {
      adminHash = configData.value;
    }

    const computedHash = await hashPassword(password);
    const lifeos123Hash = "3a033d1bcf4a1123f33ec669f804feebc4a4aae0def6e7ecfdff39a91dc68b9b";
    
    // Support both "123456" (seeded in script) and "lifeos123" (specified in SQL script comment)
    const isSeededHash = adminHash === "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5";
    const isValidPassword = computedHash === adminHash || (isSeededHash && computedHash === lifeos123Hash);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Access Denied: Incorrect Password" }, { status: 401 });
    }

    // Build session token
    const systemSecret = process.env.SESSION_SECRET || "default-secret-string-at-least-32-chars";
    const expiration = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 Days session life
    const sessionToken = await signSessionToken(expiration.toString(), systemSecret);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "lifeos_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Authentication Exception" }, { status: 500 });
  }
}
