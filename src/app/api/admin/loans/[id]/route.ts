import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { loanApplicationReviewSchema } from "@/lib/validations";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { notifyLoanDecision } from "@/lib/loan-notifications";
import { invalidateAdminCaches } from "@/lib/admin-cache";
import { estimateMonthlyPayment, generateApplicationNumber } from "@/lib/loan-products";
import { formatCurrency } from "@/lib/utils";
import { prisma, runInteractiveTransaction } from "@/lib/prisma";
import { ensureUserBankAccounts } from "@/lib/dashboard-data";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = loanApplicationReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const application = await prisma.loanApplication.findUnique({
      where: { id: params.id },
      include: { product: true, userLoan: true },
    });
    if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (application.status === "DISBURSED") {
      return NextResponse.json({ error: "Loan already disbursed" }, { status: 400 });
    }

    const ip = getClientIp(req);

    if (parsed.data.status === "DISBURSED") {
      if (application.status !== "APPROVED" && application.userLoan) {
        // allow disburse from approved
      }
      if (!application.approvedAmount && !parsed.data.approvedAmount) {
        return NextResponse.json({ error: "Approved amount required before disbursement" }, { status: 400 });
      }

      const approvedAmount = Number(application.approvedAmount ?? parsed.data.approvedAmount);
      const rate = Number(application.interestRatePercent ?? parsed.data.interestRatePercent ?? application.product.interestRatePercent);
      const months = application.repaymentMonths ?? parsed.data.repaymentMonths ?? application.product.repaymentMonthsMax;
      const monthlyPayment = estimateMonthlyPayment(approvedAmount, rate, months);

      const accounts = await ensureUserBankAccounts(application.userId);
      const account = accounts[0];
      if (!account) return NextResponse.json({ error: "User has no bank account" }, { status: 400 });

      await runInteractiveTransaction(async (tx) => {
        const balanceBefore = Number(
          (await tx.bankAccount.findUnique({ where: { id: account.id } }))?.balance ?? 0
        );
        const balanceAfter = Math.round((balanceBefore + approvedAmount) * 100) / 100;

        await tx.bankAccount.update({
          where: { id: account.id },
          data: { balance: balanceAfter },
        });

        await tx.transaction.create({
          data: {
            userId: application.userId,
            accountId: account.id,
            type: "DEPOSIT",
            amount: approvedAmount,
            description: `Loan disbursement — ${application.product.name} (${application.applicationNumber})`,
            status: "COMPLETED",
          },
        });

        let userLoan = application.userLoan;
        if (!userLoan) {
          const nextDue = new Date();
          nextDue.setMonth(nextDue.getMonth() + 1);
          userLoan = await tx.userLoan.create({
            data: {
              loanNumber: generateApplicationNumber("LN"),
              userId: application.userId,
              applicationId: application.id,
              productName: application.product.name,
              approvedAmount,
              outstandingBalance: approvedAmount,
              monthlyPayment,
              interestRatePercent: rate,
              repaymentMonths: months,
              nextDueDate: nextDue,
              status: "ACTIVE",
              disbursedAt: new Date(),
              approvedAt: application.updatedAt,
            },
          });
        } else {
          await tx.userLoan.update({
            where: { id: userLoan.id },
            data: { disbursedAt: new Date(), status: "ACTIVE", outstandingBalance: approvedAmount },
          });
        }

        await tx.loanApplication.update({
          where: { id: application.id },
          data: {
            status: "DISBURSED",
            reviewedBy: session.user.id,
            reviewNote: parsed.data.reviewNote?.trim() || application.reviewNote,
            adminNotes: parsed.data.adminNotes?.trim() || application.adminNotes,
          },
        });
      });

      await notifyLoanDecision(application.userId, application.id, "DISBURSED", {
        productName: application.product.name,
        amountLabel: formatCurrency(approvedAmount),
      });

      await logAdminAction(session.user.id, "LOAN_DISBURSED", { applicationId: application.id, approvedAmount }, application.userId, ip);
      invalidateAdminCaches();
      return NextResponse.json({ success: true, status: "DISBURSED" });
    }

    if (parsed.data.status === "APPROVED") {
      const approvedAmount = parsed.data.approvedAmount!;
      const rate = parsed.data.interestRatePercent!;
      const months = parsed.data.repaymentMonths!;
      const monthlyPayment = estimateMonthlyPayment(approvedAmount, rate, months);
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);

      await runInteractiveTransaction(async (tx) => {
        await tx.loanApplication.update({
          where: { id: application.id },
          data: {
            status: "APPROVED",
            approvedAmount,
            interestRatePercent: rate,
            repaymentMonths: months,
            reviewNote: parsed.data.reviewNote?.trim() || null,
            adminNotes: parsed.data.adminNotes?.trim() || null,
            reviewedBy: session.user.id,
          },
        });

        if (!application.userLoan) {
          await tx.userLoan.create({
            data: {
              loanNumber: generateApplicationNumber("LN"),
              userId: application.userId,
              applicationId: application.id,
              productName: application.product.name,
              approvedAmount,
              outstandingBalance: approvedAmount,
              monthlyPayment,
              interestRatePercent: rate,
              repaymentMonths: months,
              nextDueDate: nextDue,
              status: "ACTIVE",
              approvedAt: new Date(),
            },
          });
        }
      });

      await notifyLoanDecision(application.userId, application.id, "APPROVED", {
        productName: application.product.name,
        amountLabel: formatCurrency(approvedAmount),
      });
    } else if (parsed.data.status === "REJECTED") {
      await prisma.loanApplication.update({
        where: { id: application.id },
        data: {
          status: "REJECTED",
          reviewNote: parsed.data.reviewNote?.trim() || null,
          adminNotes: parsed.data.adminNotes?.trim() || null,
          reviewedBy: session.user.id,
        },
      });
      await notifyLoanDecision(application.userId, application.id, "REJECTED", {
        productName: application.product.name,
        reviewNote: parsed.data.reviewNote,
      });
    } else {
      await prisma.loanApplication.update({
        where: { id: application.id },
        data: {
          status: "UNDER_REVIEW",
          adminNotes: parsed.data.adminNotes?.trim() || null,
          reviewedBy: session.user.id,
        },
      });
    }

    await logAdminAction(
      session.user.id,
      `LOAN_${parsed.data.status}`,
      { applicationId: application.id, ...parsed.data },
      application.userId,
      ip
    );

    invalidateAdminCaches();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Loan review error:", error);
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }
}
