import { NextRequest } from "next/server";

/** Avoid "Unexpected end of JSON input" on empty bodies */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: NextRequest
): Promise<T | null> {
  const text = await request.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as T;
}
