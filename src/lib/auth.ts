import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

export async function verifyAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("lifeos_session")?.value;
    if (!sessionToken) return false;

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "session_token")
      .maybeSingle();

    if (error || !data) return false;

    return data.value === sessionToken;
  } catch (error) {
    console.error("Auth verification failed:", error);
    return false;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("lifeos_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("lifeos_session");
}
