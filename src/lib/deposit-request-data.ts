import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDbSchemaCapabilities } from "@/lib/db-schema-capabilities";

const BASE_DEPOSIT_SELECT = {
  id: true,
  amountUsd: true,
  bitcoinWalletAddress: true,
  txHash: true,
  proofNote: true,
  status: true,
  reviewNote: true,
  createdAt: true,
} satisfies Prisma.DepositRequestSelect;

function isProofImageClientError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "PrismaClientValidationError" &&
    error.message.includes("proofImage")
  );
}

export async function listUserDepositRequests(userId: string, take = 15) {
  const caps = await getDbSchemaCapabilities();
  if (!caps.depositProofImage) {
    const rows = await prisma.depositRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: BASE_DEPOSIT_SELECT,
    });
    return rows.map((row) => ({ ...row, proofImage: null as string | null }));
  }

  try {
    return await prisma.depositRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { ...BASE_DEPOSIT_SELECT, proofImage: true },
    });
  } catch (error) {
    if (!isProofImageClientError(error)) throw error;
    const rows = await prisma.depositRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: BASE_DEPOSIT_SELECT,
    });
    return rows.map((row) => ({ ...row, proofImage: null as string | null }));
  }
}

type CreateDepositInput = {
  userId: string;
  accountId: string;
  amountUsd: number;
  bitcoinWalletAddress: string;
  proofImage: string;
  proofNote: string | null;
};

export async function createDepositRequest(
  input: CreateDepositInput,
  tx: Prisma.TransactionClient = prisma
) {
  const baseData = {
    userId: input.userId,
    accountId: input.accountId,
    amountUsd: input.amountUsd,
    bitcoinWalletAddress: input.bitcoinWalletAddress,
    proofNote: input.proofNote,
    status: "PENDING" as const,
  };

  const baseSelect = {
    id: true,
    status: true,
    createdAt: true,
    amountUsd: true,
    bitcoinWalletAddress: true,
  } satisfies Prisma.DepositRequestSelect;

  const caps = await getDbSchemaCapabilities();

  try {
    if (!caps.depositProofImage) {
      const row = await tx.depositRequest.create({ data: baseData, select: baseSelect });
      return { ...row, proofImage: null as string | null };
    }

    return await tx.depositRequest.create({
      data: { ...baseData, proofImage: input.proofImage },
      select: { ...baseSelect, proofImage: true },
    });
  } catch (error) {
    if (!isProofImageClientError(error)) throw error;

    const row = await tx.depositRequest.create({ data: baseData, select: baseSelect });
    await tx.$executeRawUnsafe(
      `UPDATE "DepositRequest" SET "proofImage" = $1 WHERE "id" = $2`,
      input.proofImage,
      row.id
    );
    return { ...row, proofImage: input.proofImage };
  }
}

export async function listAdminDepositRequests() {
  const caps = await getDbSchemaCapabilities();
  const include = {
    user: { select: { id: true, name: true, email: true } },
    reviewer: { select: { name: true, email: true } },
  } as const;

  try {
    if (!caps.depositProofImage) {
      const rows = await prisma.depositRequest.findMany({
        orderBy: { createdAt: "desc" },
        include,
      });
      return rows.map((row) => ({ ...row, proofImage: null as string | null }));
    }

    return await prisma.depositRequest.findMany({
      orderBy: { createdAt: "desc" },
      include,
    });
  } catch (error) {
    if (!isProofImageClientError(error)) throw error;
    const rows = await prisma.depositRequest.findMany({
      orderBy: { createdAt: "desc" },
      include,
    });
    return rows.map((row) => ({ ...row, proofImage: null as string | null }));
  }
}
