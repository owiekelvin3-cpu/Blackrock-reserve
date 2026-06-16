function isLocalAuthUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Returns true when NextAuth can run (secret + URL). Production requires https except on localhost. */
export function isNextAuthConfigured(): boolean {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret || secret.length < 32) return false;

  const url = process.env.NEXTAUTH_URL?.trim();
  if (!url) return false;

  if (process.env.NODE_ENV === "production" && !url.startsWith("https://") && !isLocalAuthUrl(url)) {
    return false;
  }

  return true;
}
