export const VERIFICATION_BADGE_TYPES = ["NONE", "STANDARD", "BUSINESS", "GOLD"] as const;

export type VerificationBadgeType = (typeof VERIFICATION_BADGE_TYPES)[number];

export const VERIFICATION_BADGE_ACTIONS = ["GRANTED", "REVOKED", "UPGRADED", "DOWNGRADED"] as const;

export type VerificationBadgeAction = (typeof VERIFICATION_BADGE_ACTIONS)[number];

const BADGE_RANK: Record<VerificationBadgeType, number> = {
  NONE: 0,
  STANDARD: 1,
  BUSINESS: 2,
  GOLD: 3,
};

export function isVerificationBadgeType(value: string): value is VerificationBadgeType {
  return (VERIFICATION_BADGE_TYPES as readonly string[]).includes(value);
}

export function hasVerificationBadge(badge: VerificationBadgeType | string | null | undefined): badge is Exclude<VerificationBadgeType, "NONE"> {
  return badge != null && badge !== "NONE";
}

export function getVerificationBadgeLabel(badge: VerificationBadgeType): string {
  switch (badge) {
    case "STANDARD":
      return "Black Verified";
    case "BUSINESS":
      return "Green Verified";
    case "GOLD":
      return "Gold Verified";
    default:
      return "Not verified";
  }
}

export function getVerificationBadgeShortLabel(badge: VerificationBadgeType): string {
  switch (badge) {
    case "STANDARD":
      return "Black";
    case "BUSINESS":
      return "Green";
    case "GOLD":
      return "Gold";
    default:
      return "None";
  }
}

export function getVerificationBadgeDescription(badge: VerificationBadgeType): string {
  switch (badge) {
    case "STANDARD":
      return "Standard verified member — black rosette shown beside the name across the platform.";
    case "BUSINESS":
      return "Business verified account — green rosette for commercial and premium clients.";
    case "GOLD":
      return "Gold verified account — premium gold badge displayed like social media verification.";
    default:
      return "No verification badge assigned.";
  }
}

export function getVerificationBadgeAction(
  previous: VerificationBadgeType,
  next: VerificationBadgeType
): VerificationBadgeAction {
  if (next === "NONE") return "REVOKED";
  if (previous === "NONE") return "GRANTED";
  return BADGE_RANK[next] > BADGE_RANK[previous] ? "UPGRADED" : "DOWNGRADED";
}

export function serializeVerificationBadge(badge: VerificationBadgeType | string | null | undefined): VerificationBadgeType {
  return badge && isVerificationBadgeType(badge) ? badge : "NONE";
}
