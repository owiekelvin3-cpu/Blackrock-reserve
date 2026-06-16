export function isDatabaseUnavailable(error) {
  const msg = String(error?.message ?? error);
  return (
    msg.includes("Can't reach database") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("P1001") ||
    msg.includes("P1000") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("Connection timed out")
  );
}

export function warnAndSkip(label, error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.warn(`${label} skipped: ${detail}`);
}
