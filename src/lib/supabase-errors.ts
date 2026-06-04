export function isMissingTableError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const message = String((err as { message?: string })?.message ?? err);
  return code === "PGRST205" || message.includes("Could not find the table");
}

export function isRlsError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === "42501" || String((err as { message?: string })?.message ?? "").includes("row-level security");
}
