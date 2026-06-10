import { prisma } from "@/lib/prisma";
import { registeredCustomerWhere } from "@/lib/customer-auth";
import { decryptSensitive, maskSensitive } from "@/lib/encryption";

export async function getAdminTaxVerifications(filters?: { status?: string; search?: string }) {
  const rows = await prisma.taxRefundVerification.findMany({
    where: {
      user: registeredCustomerWhere,
      ...(filters?.status ? { status: filters.status as "PENDING" | "APPROVED" | "REJECTED" | "DOCUMENTS_REQUESTED" } : {}),
      ...(filters?.search
        ? {
            OR: [
              { applicationNumber: { contains: filters.search, mode: "insensitive" } },
              { fullLegalName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { user: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((r) => ({
    id: r.id,
    applicationNumber: r.applicationNumber,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    fullLegalName: r.fullLegalName,
    status: r.status,
    taxYear: r.taxYear,
    taxRefundAmountExpected: Number(r.taxRefundAmountExpected),
    createdAt: r.createdAt.toISOString(),
    hasDocuments: Boolean(r.governmentId || r.taxReturnDocument || r.w2Form || r.proofOfAddress),
  }));
}

export async function getAdminTaxVerificationDetail(id: string) {
  const r = await prisma.taxRefundVerification.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!r || r.user.role === "ADMIN") return null;

  return {
    id: r.id,
    applicationNumber: r.applicationNumber,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    fullLegalName: r.fullLegalName,
    dateOfBirth: r.dateOfBirth.toISOString(),
    ssnMasked: maskSensitive(decryptSensitive(r.ssnEncrypted)),
    phone: r.phone,
    email: r.email,
    residentialAddress: r.residentialAddress,
    city: r.city,
    state: r.state,
    zipCode: r.zipCode,
    employerName: r.employerName,
    employerAddress: r.employerAddress,
    jobTitle: r.jobTitle,
    annualIncome: Number(r.annualIncome),
    employmentStartDate: r.employmentStartDate.toISOString(),
    taxFilingStatus: r.taxFilingStatus,
    taxYear: r.taxYear,
    adjustedGrossIncome: Number(r.adjustedGrossIncome),
    federalTaxPaid: Number(r.federalTaxPaid),
    taxRefundAmountExpected: Number(r.taxRefundAmountExpected),
    tinMasked: maskSensitive(decryptSensitive(r.tinEncrypted)),
    irsFilingConfirmationNumber: r.irsFilingConfirmationNumber,
    bankName: r.bankName,
    accountHolderName: r.accountHolderName,
    accountNumberMasked: maskSensitive(decryptSensitive(r.accountNumberEncrypted)),
    routingNumberMasked: maskSensitive(decryptSensitive(r.routingNumberEncrypted)),
    governmentId: r.governmentId,
    taxReturnDocument: r.taxReturnDocument,
    w2Form: r.w2Form,
    proofOfAddress: r.proofOfAddress,
    status: r.status,
    reviewNote: r.reviewNote,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getAdminLoanApplications(filters?: { status?: string; search?: string }) {
  const rows = await prisma.loanApplication.findMany({
    where: {
      user: registeredCustomerWhere,
      ...(filters?.status ? { status: filters.status as "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED" } : {}),
      ...(filters?.search
        ? {
            OR: [
              { applicationNumber: { contains: filters.search, mode: "insensitive" } },
              { user: { name: { contains: filters.search, mode: "insensitive" } } },
              { user: { email: { contains: filters.search, mode: "insensitive" } } },
              { product: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: true,
      userLoan: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((a) => ({
    id: a.id,
    applicationNumber: a.applicationNumber,
    userId: a.userId,
    userName: a.user.name,
    userEmail: a.user.email,
    productName: a.product.name,
    productType: a.product.type,
    requestedAmount: Number(a.requestedAmount),
    approvedAmount: a.approvedAmount ? Number(a.approvedAmount) : null,
    interestRatePercent: a.interestRatePercent ? Number(a.interestRatePercent) : null,
    repaymentMonths: a.repaymentMonths,
    status: a.status,
    loanPurpose: a.loanPurpose,
    monthlyIncome: Number(a.monthlyIncome),
    employmentStatus: a.employmentStatus,
    supportingDocuments: a.supportingDocuments,
    reviewNote: a.reviewNote,
    adminNotes: a.adminNotes,
    hasUserLoan: Boolean(a.userLoan),
    createdAt: a.createdAt.toISOString(),
  }));
}
