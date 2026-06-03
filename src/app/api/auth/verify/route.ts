import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  try {
    const isAuth = await verifyAuth();
    return NextResponse.json({ authenticated: isAuth });
  } catch (err) {
    console.error("Auth verify route error:", err);
    return NextResponse.json({ authenticated: false });
  }
}
