/** Returns true when NextAuth can run in production (secret + URL). */
export function isNextAuthConfigured(): boolean {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret || secret.length < 32) return false;

  if (process.env.NODE_ENV === "production") {
    const url = process.env.NEXTAUTH_URL?.trim();
    if (!url || !url.startsWith("https://")) return false;
  }

  return true;
}
