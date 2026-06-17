export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Exit 0 during `npm run build` when Vercel/env has no database configured yet. */
export function skipBuildMigrationIfNoDatabase(label) {
  if (!hasDatabaseUrl()) {
    console.warn(
      `${label} skipped: DATABASE_URL is not set. Add DATABASE_URL (and DIRECT_URL) in Vercel → Settings → Environment Variables, then redeploy.`
    );
    process.exit(0);
  }
}

export function isDatabaseUnavailable(error) {
  const msg = String(error?.message ?? error);
  return (
    msg.includes("Environment variable not found: DATABASE_URL") ||
    msg.includes("Can't reach database") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("P1001") ||
    msg.includes("P1000") ||
    msg.includes("P2024") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("Connection timed out") ||
    msg.includes("statement timeout") ||
    msg.includes("57014")
  );
}

export function warnAndSkip(label, error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.warn(`${label} skipped: ${detail}`);
}
