export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

const GREETING_LABELS: Record<GreetingPeriod, string> = {
  morning: "Good Morning",
  afternoon: "Good Afternoon",
  evening: "Good Evening",
  night: "Good Night",
};

/** Hour in 24h local time → greeting period */
export function getGreetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 0 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getGreetingLabel(period: GreetingPeriod): string {
  return GREETING_LABELS[period];
}

/** First token of display name for personalized greeting */
export function getFirstName(name?: string | null): string | null {
  if (!name?.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  return first || null;
}

export function buildGreetingMessage(period: GreetingPeriod, firstName: string | null): string {
  const label = getGreetingLabel(period);
  if (!firstName) return "Welcome Back 👋";
  return `${label}, ${firstName} 👋`;
}

export function resolveBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function resolveBrowserLocale(): string {
  if (typeof navigator === "undefined") return "en-US";
  return navigator.language || "en-US";
}
