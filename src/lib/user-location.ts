import { prisma } from "@/lib/prisma";
import { lookupIpLocation } from "@/lib/geo-location";

/** Resolve geo from IP and persist on the user record (non-blocking for callers). */
export async function captureUserLocation(
  userId: string,
  ip?: string,
  options?: { isSignup?: boolean }
) {
  const geo = await lookupIpLocation(ip);
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastSeenAt: now,
      ...(ip ? { lastLoginIp: ip } : {}),
      ...(options?.isSignup && ip ? { signupIp: ip } : {}),
      ...(geo?.city ? { city: geo.city } : {}),
      ...(geo?.region ? { region: geo.region } : {}),
      ...(geo?.country ? { country: geo.country } : {}),
    },
  });
}

/** Fire-and-forget — never block auth or registration responses. */
export function captureUserLocationAsync(
  userId: string,
  ip?: string,
  options?: { isSignup?: boolean }
) {
  void captureUserLocation(userId, ip, options).catch((err) => {
    console.error("Location capture failed:", err);
  });
}
