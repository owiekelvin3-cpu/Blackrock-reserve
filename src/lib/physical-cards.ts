import type { CardRequestStatus, PhysicalCardTier } from "@prisma/client";
import { prisma, runInteractiveTransaction } from "@/lib/prisma";
import { getPlatformSettings, SETTING_KEYS } from "@/lib/platform-settings";
import { createUserNotification } from "@/lib/user-notifications";
import {
  CARD_STATUS_PIPELINE,
  CARD_TIER_CONFIG,
  STATUS_ETA_DAYS,
  STATUS_LABELS,
  TERMINAL_STATUSES,
} from "@/lib/physical-cards-constants";

export {
  CARD_STATUS_PIPELINE,
  CARD_TIER_CONFIG,
  STATUS_LABELS,
  STATUS_ETA_DAYS,
  TERMINAL_STATUSES,
} from "@/lib/physical-cards-constants";

export type PhysicalCardRequirements = {
  ordersEnabled: boolean;
  requireKyc: boolean;
  requireInvestment: boolean;
  minAccountBalance: number;
  requirePhone: boolean;
  requireEmailVerified: boolean;
};

export async function getPhysicalCardRequirements(): Promise<PhysicalCardRequirements> {
  const settings = await getPlatformSettings();
  return {
    ordersEnabled: settings[SETTING_KEYS.PHYSICAL_CARD_ORDERS_ENABLED] !== "false",
    requireKyc: settings[SETTING_KEYS.PHYSICAL_CARD_REQUIRE_KYC] !== "false",
    requireInvestment: settings[SETTING_KEYS.PHYSICAL_CARD_REQUIRE_INVESTMENT] === "true",
    minAccountBalance: Number(settings[SETTING_KEYS.PHYSICAL_CARD_MIN_BALANCE] || "0") || 0,
    requirePhone: settings[SETTING_KEYS.PHYSICAL_CARD_REQUIRE_PHONE] !== "false",
    requireEmailVerified: settings[SETTING_KEYS.PHYSICAL_CARD_REQUIRE_EMAIL] !== "false",
  };
}

export type EligibilityItem = {
  id: string;
  label: string;
  met: boolean;
  detail?: string;
};

export async function checkPhysicalCardEligibility(userId: string) {
  const requirements = await getPhysicalCardRequirements();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      kycStatus: true,
      phone: true,
      emailVerified: true,
      status: true,
      accounts: { select: { balance: true } },
      investments: { select: { id: true }, take: 1 },
      investmentOrders: { select: { id: true }, take: 1 },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return { eligible: false, requirements, items: [] as EligibilityItem[], reason: "Account is not active" };
  }

  const totalBalance = user.accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const hasInvestment = user.investments.length > 0 || user.investmentOrders.length > 0;

  const items: EligibilityItem[] = [
    {
      id: "orders",
      label: "Physical card ordering is open",
      met: requirements.ordersEnabled,
    },
    {
      id: "kyc",
      label: "Identity verification completed",
      met: !requirements.requireKyc || user.kycStatus === "VERIFIED",
      detail: user.kycStatus === "VERIFIED" ? undefined : `Current status: ${user.kycStatus}`,
    },
    {
      id: "investment",
      label: "Active investment account",
      met: !requirements.requireInvestment || hasInvestment,
    },
    {
      id: "balance",
      label: `Minimum account balance ($${requirements.minAccountBalance.toLocaleString()})`,
      met: totalBalance >= requirements.minAccountBalance,
      detail: `Available: $${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      id: "phone",
      label: "Valid contact phone on file",
      met: !requirements.requirePhone || Boolean(user.phone?.trim()),
    },
    {
      id: "email",
      label: "Email address verified",
      met: !requirements.requireEmailVerified || Boolean(user.emailVerified),
    },
  ];

  const eligible = items.every((i) => i.met);
  return { eligible, requirements, items, reason: eligible ? null : "Complete all requirements to order a card" };
}

function serializeRequest(
  row: {
    id: string;
    cardTier: PhysicalCardTier;
    status: CardRequestStatus;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    stateRegion: string;
    postalCode: string;
    country: string;
    deliveryInstructions: string | null;
    trackingNumber: string | null;
    shippingCarrier: string | null;
    estimatedDeliveryDate: Date | null;
    rejectionReason: string | null;
    statusEtaDays: number | null;
    createdAt: Date;
    updatedAt: Date;
    events?: { id: string; status: CardRequestStatus; note: string | null; createdAt: Date }[];
    bankCard?: {
      id: string;
      lastFour: string;
      expiryMonth: number;
      expiryYear: number;
      status: string;
      tier: PhysicalCardTier;
    } | null;
  },
  includeEvents = false
) {
  void includeEvents;
  const pipelineIndex = CARD_STATUS_PIPELINE.indexOf(row.status);
  return {
    id: row.id,
    cardTier: row.cardTier,
    tierLabel: CARD_TIER_CONFIG[row.cardTier].label,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    pipelineIndex: pipelineIndex >= 0 ? pipelineIndex : null,
    recipientName: row.recipientName,
    phone: row.phone,
    address: {
      line1: row.addressLine1,
      line2: row.addressLine2,
      city: row.city,
      stateRegion: row.stateRegion,
      postalCode: row.postalCode,
      country: row.country,
      formatted: formatAddress(row),
    },
    deliveryInstructions: row.deliveryInstructions,
    trackingNumber: row.trackingNumber,
    shippingCarrier: row.shippingCarrier,
    estimatedDeliveryDate: row.estimatedDeliveryDate?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    statusEtaDays: row.statusEtaDays ?? STATUS_ETA_DAYS[row.status] ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    issuedCard: row.bankCard
      ? {
          id: row.bankCard.id,
          lastFour: row.bankCard.lastFour,
          maskedNumber: `•••• •••• •••• ${row.bankCard.lastFour}`,
          expiry: `${String(row.bankCard.expiryMonth).padStart(2, "0")}/${String(row.bankCard.expiryYear).slice(-2)}`,
          status: row.bankCard.status,
          tier: row.bankCard.tier,
          tierLabel: CARD_TIER_CONFIG[row.bankCard.tier].label,
        }
      : null,
  };
}

function formatAddress(row: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
}) {
  const lines = [row.addressLine1];
  if (row.addressLine2) lines.push(row.addressLine2);
  lines.push(`${row.city}, ${row.stateRegion} ${row.postalCode}`);
  lines.push(row.country);
  return lines.join("\n");
}

export async function getUserPhysicalCardsDashboard(userId: string) {
  const [eligibility, requests, activeCard] = await Promise.all([
    checkPhysicalCardEligibility(userId),
    prisma.cardRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        bankCard: {
          select: { id: true, lastFour: true, expiryMonth: true, expiryYear: true, status: true, tier: true },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.bankCard.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PENDING_ACTIVATION"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeRequest = requests.find((r) => !TERMINAL_STATUSES.includes(r.status)) ?? null;
  const hasOpenRequest = Boolean(activeRequest);

  return {
    eligibility,
    hasOpenRequest,
    activeRequest: activeRequest ? serializeRequest(activeRequest, true) : null,
    history: requests.map((r) => serializeRequest(r)),
    issuedCard: activeCard
      ? {
          id: activeCard.id,
          lastFour: activeCard.lastFour,
          maskedNumber: `•••• •••• •••• ${activeCard.lastFour}`,
          expiry: `${String(activeCard.expiryMonth).padStart(2, "0")}/${String(activeCard.expiryYear).slice(-2)}`,
          status: activeCard.status,
          tier: activeCard.tier,
          tierLabel: CARD_TIER_CONFIG[activeCard.tier].label,
          frozen: activeCard.frozen,
        }
      : null,
    tiers: Object.entries(CARD_TIER_CONFIG).map(([id, cfg]) => ({
      id: id as PhysicalCardTier,
      ...cfg,
    })),
    pipeline: CARD_STATUS_PIPELINE.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      etaDays: STATUS_ETA_DAYS[status] ?? null,
    })),
  };
}

export async function createPhysicalCardRequest(
  userId: string,
  input: {
    cardTier: PhysicalCardTier;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateRegion: string;
    postalCode: string;
    country: string;
    deliveryInstructions?: string;
  }
) {
  const eligibility = await checkPhysicalCardEligibility(userId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? "You are not eligible to order a physical card");
  }

  const open = await prisma.cardRequest.findFirst({
    where: {
      userId,
      status: { notIn: TERMINAL_STATUSES },
    },
  });
  if (open) {
    throw new Error("You already have an active card request in progress");
  }

  const request = await runInteractiveTransaction(async (tx) => {
    const row = await tx.cardRequest.create({
      data: {
        userId,
        cardTier: input.cardTier,
        status: "PENDING_REVIEW",
        recipientName: input.recipientName.trim(),
        phone: input.phone.trim(),
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city.trim(),
        stateRegion: input.stateRegion.trim(),
        postalCode: input.postalCode.trim(),
        country: input.country.trim() || "US",
        deliveryInstructions: input.deliveryInstructions?.trim() || null,
        statusEtaDays: STATUS_ETA_DAYS.PENDING_REVIEW ?? 2,
      },
    });

    await tx.cardRequestEvent.create({
      data: {
        cardRequestId: row.id,
        status: "PENDING_REVIEW",
        note: "Card request submitted by client",
      },
    });

    await createUserNotification(
      {
        userId,
        type: "ACCOUNT_UPDATE",
        title: "Physical card request received",
        message: `Your ${CARD_TIER_CONFIG[input.cardTier].label} request is pending review. We will notify you at each stage.`,
      },
      tx
    );

    return row;
  });

  return serializeRequest(request);
}

export async function getAdminCardRequests(statusFilter?: string) {
  const where =
    statusFilter && statusFilter !== "all"
      ? { status: statusFilter as CardRequestStatus }
      : {};

  const rows = await prisma.cardRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, kycStatus: true, phone: true } },
      bankCard: { select: { id: true, lastFour: true, expiryMonth: true, expiryYear: true, status: true, tier: true } },
      events: { orderBy: { createdAt: "asc" }, include: { admin: { select: { name: true } } } },
    },
  });

  return rows.map((r) => ({
    ...serializeRequest(r, true),
    user: r.user,
    events: r.events.map((e) => ({
      id: e.id,
      status: e.status,
      statusLabel: STATUS_LABELS[e.status],
      note: e.note,
      adminName: e.admin?.name ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  }));
}

export async function adminUpdateCardRequest(
  adminId: string,
  requestId: string,
  patch: {
    status?: CardRequestStatus;
    trackingNumber?: string;
    shippingCarrier?: string;
    estimatedDeliveryDate?: string;
    rejectionReason?: string;
    adminNote?: string;
    statusEtaDays?: number;
    lastFour?: string;
    expiryMonth?: number;
    expiryYear?: number;
  }
) {
    const existing = await prisma.cardRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { id: true, name: true } }, bankCard: true },
  });
  if (!existing) throw new Error("Card request not found");

  const targetUserId = existing.userId;

  if (existing.status === "DELIVERED" || existing.status === "REJECTED" || existing.status === "CANCELLED") {
    throw new Error("This request is closed and cannot be updated");
  }

  const nextStatus = patch.status ?? existing.status;

  const updated = await runInteractiveTransaction(async (tx) => {
    const row = await tx.cardRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        trackingNumber: patch.trackingNumber?.trim() || existing.trackingNumber,
        shippingCarrier: patch.shippingCarrier?.trim() || existing.shippingCarrier,
        estimatedDeliveryDate: patch.estimatedDeliveryDate
          ? new Date(patch.estimatedDeliveryDate)
          : existing.estimatedDeliveryDate,
        rejectionReason: patch.rejectionReason?.trim() || existing.rejectionReason,
        adminNote: patch.adminNote?.trim() || existing.adminNote,
        statusEtaDays: patch.statusEtaDays ?? existing.statusEtaDays,
      },
    });

    if (nextStatus !== existing.status) {
      await tx.cardRequestEvent.create({
        data: {
          cardRequestId: requestId,
          status: nextStatus,
          note: patch.adminNote?.trim() || patch.rejectionReason?.trim() || `Status updated to ${STATUS_LABELS[nextStatus]}`,
          adminId,
        },
      });
    }

    if (nextStatus === "DELIVERED" && patch.lastFour && patch.expiryMonth && patch.expiryYear) {
      if (!existing.bankCard) {
        await tx.bankCard.create({
          data: {
            userId: existing.userId,
            cardRequestId: requestId,
            cardholderName: existing.recipientName,
            lastFour: patch.lastFour.replace(/\D/g, "").slice(-4),
            expiryMonth: patch.expiryMonth,
            expiryYear: patch.expiryYear,
            tier: existing.cardTier,
            status: "ACTIVE",
            issuedAt: new Date(),
          },
        });
      }
    }

    return row;
  });

  const statusMessage =
    nextStatus === "REJECTED"
      ? `Your physical card request was not approved.${patch.rejectionReason ? ` Reason: ${patch.rejectionReason}` : ""}`
      : `Your physical card request is now: ${STATUS_LABELS[nextStatus]}.`;

  await createUserNotification({
    userId: existing.userId,
    type: "ACCOUNT_UPDATE",
    title: "Card request update",
    message: statusMessage,
  });

  return { ...serializeRequest(updated), userId: targetUserId };
}

export async function countPendingCardRequests(): Promise<number> {
  try {
    return await prisma.cardRequest.count({
      where: { status: { in: ["PENDING_REVIEW", "UNDER_VERIFICATION"] } },
    });
  } catch {
    return 0;
  }
}
