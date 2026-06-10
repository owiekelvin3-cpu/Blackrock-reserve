import { prisma } from "@/lib/prisma";
import { encryptSensitive, hashSensitive } from "@/lib/encryption";
import {
  ensureLoanProductsSeeded,
  estimateMonthlyPayment,
  generateApplicationNumber,
} from "@/lib/loan-products";
import type { TaxRefundVerificationStatus, LoanApplicationStatus } from "@prisma/client";

const MAX_DOC_LENGTH = 4_000_000;

function assertDocSize(value: string | undefined, field: string) {
  if (value && value.length > MAX_DOC_LENGTH) {
    throw new Error(`${field} file is too large. Please use a smaller image or PDF.`);
  }
}

export async function getLoanDashboardData(userId: string) {
  await ensureLoanProductsSeeded();

  const [taxVerification, products, applications, activeLoans, loanHistory] = await Promise.all([
    prisma.taxRefundVerification.findUnique({ where: { userId } }),
    prisma.loanProduct.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
    prisma.loanApplication.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.userLoan.findMany({
      where: { userId, status: "ACTIVE" },
      include: { repayments: { orderBy: { paidAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userLoan.findMany({
      where: { userId, status: { not: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const loanAccessApproved = taxVerification?.status === "APPROVED";

  return {
    loanAccessApproved,
    taxVerification: taxVerification
      ? {
          id: taxVerification.id,
          applicationNumber: taxVerification.applicationNumber,
          status: taxVerification.status,
          reviewNote: taxVerification.reviewNote,
          adminNotes: taxVerification.adminNotes,
          createdAt: taxVerification.createdAt.toISOString(),
          updatedAt: taxVerification.updatedAt.toISOString(),
        }
      : null,
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      type: p.type,
      description: p.description,
      minAmount: Number(p.minAmount),
      maxAmount: Number(p.maxAmount),
      interestRatePercent: Number(p.interestRatePercent),
      repaymentMonthsMin: p.repaymentMonthsMin,
      repaymentMonthsMax: p.repaymentMonthsMax,
      eligibilityCriteria: p.eligibilityCriteria,
      fastApproval: p.fastApproval,
      estimatedMonthlyPayment: estimateMonthlyPayment(
        Number(p.maxAmount) * 0.5,
        Number(p.interestRatePercent),
        Math.round((p.repaymentMonthsMin + p.repaymentMonthsMax) / 2)
      ),
    })),
    applications: applications.map((a) => ({
      id: a.id,
      applicationNumber: a.applicationNumber,
      productName: a.product.name,
      productType: a.product.type,
      requestedAmount: Number(a.requestedAmount),
      status: a.status,
      approvedAmount: a.approvedAmount ? Number(a.approvedAmount) : null,
      reviewNote: a.reviewNote,
      createdAt: a.createdAt.toISOString(),
    })),
    activeLoans: activeLoans.map((l) => mapUserLoan(l)),
    loanHistory: loanHistory.map((l) => mapUserLoan({ ...l, repayments: [] })),
  };
}

function mapUserLoan(l: {
  id: string;
  loanNumber: string;
  productName: string;
  approvedAmount: { toString(): string } | number;
  outstandingBalance: { toString(): string } | number;
  monthlyPayment: { toString(): string } | number;
  nextDueDate: Date | null;
  status: string;
  disbursedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  repayments: { id: string; amount: { toString(): string } | number; paidAt: Date; note: string | null }[];
}) {
  return {
    id: l.id,
    loanNumber: l.loanNumber,
    productName: l.productName,
    approvedAmount: Number(l.approvedAmount),
    outstandingBalance: Number(l.outstandingBalance),
    monthlyPayment: Number(l.monthlyPayment),
    nextDueDate: l.nextDueDate?.toISOString() ?? null,
    status: l.status,
    disbursedAt: l.disbursedAt?.toISOString() ?? null,
    approvedAt: l.approvedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    repayments: l.repayments.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      paidAt: r.paidAt.toISOString(),
      note: r.note,
    })),
  };
}

export async function submitTaxRefundVerification(
  userId: string,
  data: {
    fullLegalName: string;
    dateOfBirth: string;
    ssn: string;
    phone: string;
    email: string;
    residentialAddress: string;
    city: string;
    state: string;
    zipCode: string;
    employerName: string;
    employerAddress: string;
    jobTitle: string;
    annualIncome: number;
    employmentStartDate: string;
    taxFilingStatus: string;
    taxYear: string;
    adjustedGrossIncome: number;
    federalTaxPaid: number;
    taxRefundAmountExpected: number;
    tin: string;
    irsFilingConfirmationNumber: string;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    routingNumber: string;
    governmentId?: string;
    taxReturnDocument?: string;
    w2Form?: string;
    proofOfAddress?: string;
    declarationAccepted: boolean;
  }
) {
  assertDocSize(data.governmentId, "Government ID");
  assertDocSize(data.taxReturnDocument, "Tax return");
  assertDocSize(data.w2Form, "W-2");
  assertDocSize(data.proofOfAddress, "Proof of address");

  const existing = await prisma.taxRefundVerification.findUnique({ where: { userId } });
  if (existing?.status === "APPROVED") {
    throw new Error("Your tax refund verification is already approved.");
  }
  if (existing?.status === "PENDING") {
    throw new Error("You already have a tax refund verification under review.");
  }

  const ssnNormalized = data.ssn.replace(/\D/g, "");
  const ssnHash = hashSensitive(ssnNormalized);

  const duplicateSsn = await prisma.taxRefundVerification.findFirst({
    where: {
      ssnHash,
      userId: { not: userId },
      status: { in: ["PENDING", "APPROVED"] },
    },
  });
  if (duplicateSsn) {
    throw new Error("This Social Security Number is already associated with another application.");
  }

  const payload = {
    fullLegalName: data.fullLegalName.trim(),
    dateOfBirth: new Date(data.dateOfBirth),
    ssnEncrypted: encryptSensitive(ssnNormalized),
    ssnHash,
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    residentialAddress: data.residentialAddress.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    zipCode: data.zipCode.trim(),
    employerName: data.employerName.trim(),
    employerAddress: data.employerAddress.trim(),
    jobTitle: data.jobTitle.trim(),
    annualIncome: data.annualIncome,
    employmentStartDate: new Date(data.employmentStartDate),
    taxFilingStatus: data.taxFilingStatus,
    taxYear: data.taxYear,
    adjustedGrossIncome: data.adjustedGrossIncome,
    federalTaxPaid: data.federalTaxPaid,
    taxRefundAmountExpected: data.taxRefundAmountExpected,
    tinEncrypted: encryptSensitive(data.tin.replace(/\D/g, "")),
    irsFilingConfirmationNumber: data.irsFilingConfirmationNumber.trim(),
    bankName: data.bankName.trim(),
    accountHolderName: data.accountHolderName.trim(),
    accountNumberEncrypted: encryptSensitive(data.accountNumber.replace(/\D/g, "")),
    routingNumberEncrypted: encryptSensitive(data.routingNumber.replace(/\D/g, "")),
    governmentId: data.governmentId || null,
    taxReturnDocument: data.taxReturnDocument || null,
    w2Form: data.w2Form || null,
    proofOfAddress: data.proofOfAddress || null,
    declarationAccepted: data.declarationAccepted,
    status: "PENDING" as TaxRefundVerificationStatus,
    reviewNote: null,
    reviewedBy: null,
  };

  if (existing) {
    return prisma.taxRefundVerification.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.taxRefundVerification.create({
    data: {
      userId,
      applicationNumber: generateApplicationNumber("TAX"),
      ...payload,
    },
  });
}

export async function submitLoanApplication(
  userId: string,
  data: {
    productId: string;
    requestedAmount: number;
    loanPurpose: string;
    monthlyIncome: number;
    employmentStatus: string;
    supportingDocuments?: string;
  }
) {
  assertDocSize(data.supportingDocuments, "Supporting document");

  const taxVerification = await prisma.taxRefundVerification.findUnique({ where: { userId } });
  if (!taxVerification || taxVerification.status !== "APPROVED") {
    throw new Error("Tax refund verification must be approved before applying for a loan.");
  }

  const product = await prisma.loanProduct.findFirst({
    where: { id: data.productId, enabled: true },
  });
  if (!product) throw new Error("Loan product not available.");

  const amount = Math.round(data.requestedAmount * 100) / 100;
  if (amount < Number(product.minAmount) || amount > Number(product.maxAmount)) {
    throw new Error(
      `Requested amount must be between $${Number(product.minAmount).toLocaleString()} and $${Number(product.maxAmount).toLocaleString()}.`
    );
  }

  const recentDuplicate = await prisma.loanApplication.findFirst({
    where: {
      userId,
      productId: data.productId,
      requestedAmount: amount,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  });
  if (recentDuplicate) {
    throw new Error("Duplicate application detected. Please wait before submitting again.");
  }

  return prisma.loanApplication.create({
    data: {
      applicationNumber: generateApplicationNumber("LOAN"),
      userId,
      productId: product.id,
      taxVerificationId: taxVerification.id,
      requestedAmount: amount,
      loanPurpose: data.loanPurpose.trim(),
      monthlyIncome: data.monthlyIncome,
      employmentStatus: data.employmentStatus,
      supportingDocuments: data.supportingDocuments || null,
      status: "SUBMITTED",
    },
    include: { product: true },
  });
}

export type { LoanApplicationStatus };
