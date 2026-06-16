import type { CardRequestStatus, PhysicalCardTier } from "@prisma/client";

export const CARD_STATUS_PIPELINE: CardRequestStatus[] = [
  "PENDING_REVIEW",
  "UNDER_VERIFICATION",
  "APPROVED",
  "CARD_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
];

export const TERMINAL_STATUSES: CardRequestStatus[] = ["DELIVERED", "REJECTED", "CANCELLED"];

export const CARD_TIER_CONFIG: Record<
  PhysicalCardTier,
  {
    label: string;
    shortLabel: string;
    description: string;
    gradient: string;
    accent: string;
    chip: string;
    text: string;
    processingDays: number;
    benefits: string[];
  }
> = {
  STANDARD: {
    label: "Standard Debit",
    shortLabel: "Standard",
    description: "Everyday banking with contactless payments and global ATM access.",
    gradient: "linear-gradient(145deg, #1c1f26 0%, #3d4556 42%, #252a33 100%)",
    accent: "#e8edf4",
    chip: "#d4dce8",
    text: "#ffffff",
    processingDays: 7,
    benefits: ["Contactless worldwide", "Global ATM access", "Zero-liability protection"],
  },
  PREMIUM: {
    label: "Premium Debit",
    shortLabel: "Premium",
    description: "Elevated limits, priority support, and premium metal finish.",
    gradient: "linear-gradient(145deg, #1a1408 0%, #6b5218 38%, #c9a227 72%, #8b6914 100%)",
    accent: "#ffe566",
    chip: "#f5e6a8",
    text: "#1a1200",
    processingDays: 5,
    benefits: ["Metal card finish", "Priority production", "Elevated daily limits"],
  },
  BLACK_ELITE: {
    label: "Black Elite",
    shortLabel: "Black Elite",
    description: "Private banking tier with concierge delivery and exclusive benefits.",
    gradient: "linear-gradient(145deg, #050506 0%, #141418 35%, #2a2a32 70%, #0a0a0c 100%)",
    accent: "#ff5f05",
    chip: "#b8bcc8",
    text: "#ffffff",
    processingDays: 3,
    benefits: ["Concierge delivery", "Private client support", "Exclusive card benefits"],
  },
};

export const STATUS_LABELS: Record<CardRequestStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  UNDER_VERIFICATION: "Under Verification",
  APPROVED: "Approved",
  CARD_PRODUCTION: "Card Production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const STATUS_ETA_DAYS: Partial<Record<CardRequestStatus, number>> = {
  PENDING_REVIEW: 2,
  UNDER_VERIFICATION: 3,
  APPROVED: 2,
  CARD_PRODUCTION: 5,
  SHIPPED: 7,
};
