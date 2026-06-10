import { prisma } from "@/lib/prisma";
import { LoanProductType } from "@prisma/client";

type ProductSeed = {
  slug: string;
  name: string;
  type: LoanProductType;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRatePercent: number;
  repaymentMonthsMin: number;
  repaymentMonthsMax: number;
  eligibilityCriteria: string;
  fastApproval?: boolean;
  sortOrder: number;
};

const LOAN_PRODUCT_SEEDS: ProductSeed[] = [
  {
    slug: "personal-loan",
    name: "Personal Loan",
    type: "PERSONAL",
    description: "Flexible unsecured financing for major purchases, debt consolidation, or personal goals.",
    minAmount: 1000,
    maxAmount: 75000,
    interestRatePercent: 7.49,
    repaymentMonthsMin: 12,
    repaymentMonthsMax: 60,
    eligibilityCriteria: "Verified tax refund, minimum annual income $24,000, active account in good standing.",
    sortOrder: 1,
  },
  {
    slug: "business-loan",
    name: "Business Loan",
    type: "BUSINESS",
    description: "Capital for expansion, equipment, inventory, or working capital needs.",
    minAmount: 5000,
    maxAmount: 250000,
    interestRatePercent: 8.99,
    repaymentMonthsMin: 12,
    repaymentMonthsMax: 84,
    eligibilityCriteria: "Business account type or verified self-employment income, 2+ years tax filing history preferred.",
    sortOrder: 2,
  },
  {
    slug: "investment-loan",
    name: "Investment Loan",
    type: "INVESTMENT",
    description: "Leverage capital markets opportunities with structured repayment aligned to portfolio growth.",
    minAmount: 2500,
    maxAmount: 100000,
    interestRatePercent: 6.99,
    repaymentMonthsMin: 6,
    repaymentMonthsMax: 48,
    eligibilityCriteria: "Approved tax verification, active investment portfolio, minimum $5,000 account balance.",
    sortOrder: 3,
  },
  {
    slug: "emergency-loan",
    name: "Emergency Loan",
    type: "EMERGENCY",
    description: "Rapid-access funds for urgent financial needs with accelerated review.",
    minAmount: 500,
    maxAmount: 15000,
    interestRatePercent: 11.49,
    repaymentMonthsMin: 3,
    repaymentMonthsMax: 24,
    eligibilityCriteria: "Verified identity, approved tax refund form, no delinquent loans.",
    fastApproval: true,
    sortOrder: 4,
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureLoanProductsSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      for (const seed of LOAN_PRODUCT_SEEDS) {
        await prisma.loanProduct.upsert({
          where: { slug: seed.slug },
          create: { ...seed, updatedAt: new Date() },
          update: {
            name: seed.name,
            type: seed.type,
            description: seed.description,
            minAmount: seed.minAmount,
            maxAmount: seed.maxAmount,
            interestRatePercent: seed.interestRatePercent,
            repaymentMonthsMin: seed.repaymentMonthsMin,
            repaymentMonthsMax: seed.repaymentMonthsMax,
            eligibilityCriteria: seed.eligibilityCriteria,
            fastApproval: seed.fastApproval ?? false,
            sortOrder: seed.sortOrder,
            enabled: true,
          },
        });
      }
    })();
  }
  await seedPromise;
}

export function estimateMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  months: number
): number {
  if (months <= 0 || principal <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return Math.round((principal / months) * 100) / 100;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment * 100) / 100;
}

export function generateApplicationNumber(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function getLoanProgressStep(
  taxStatus: string | null | undefined,
  hasApplication: boolean,
  loanDisbursed: boolean
): number {
  if (!taxStatus) return 1;
  if (taxStatus === "PENDING" || taxStatus === "DOCUMENTS_REQUESTED" || taxStatus === "REJECTED") return 2;
  if (taxStatus !== "APPROVED") return 2;
  if (!hasApplication) return 3;
  if (loanDisbursed) return 5;
  return 4;
}
