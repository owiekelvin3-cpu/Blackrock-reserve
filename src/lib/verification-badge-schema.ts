export function isVerificationSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("verificationBadge") ||
    message.includes("VerificationBadgeHistory") ||
    message.includes("VerificationBadgeType") ||
    message.includes("does not exist")
  );
}

export function verificationSchemaErrorMessage(): string {
  return "Verification badge tables are not in the database yet. Open Supabase → SQL Editor, paste and run scripts/verification-badge-supabase.sql, then refresh this page.";
}
