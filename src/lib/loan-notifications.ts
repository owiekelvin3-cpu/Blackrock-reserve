import { createUserNotification, sendUserNotificationEmail } from "@/lib/user-notifications";
import { sendEmail } from "@/lib/email";
import { userNotificationEmail } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";

async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  taxRefundId?: string;
  loanApplicationId?: string;
}) {
  await createUserNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    taxRefundId: params.taxRefundId,
    loanApplicationId: params.loanApplicationId,
  });
  await sendUserNotificationEmail({
    userId: params.userId,
    title: params.title,
    message: params.message,
  });
}

export async function notifyTaxRefundSubmitted(userId: string, taxRefundId: string, applicationNumber: string) {
  await notifyUser({
    userId,
    type: "TAX_REFUND_SUBMITTED",
    title: "Tax Refund Verification Submitted",
    message: `Your tax refund verification (${applicationNumber}) has been received and is pending review. Loan products will become available after approval.`,
    taxRefundId,
  });
}

export async function notifyTaxRefundDecision(
  userId: string,
  taxRefundId: string,
  approved: boolean,
  reviewNote?: string | null
) {
  if (approved) {
    await notifyUser({
      userId,
      type: "TAX_REFUND_APPROVED",
      title: "Tax Refund Verification Approved",
      message: "Your tax refund verification has been approved. You now have access to the loan marketplace.",
      taxRefundId,
    });
    return;
  }
  const reason = reviewNote?.trim() ? ` ${reviewNote}` : "";
  await notifyUser({
    userId,
    type: "TAX_REFUND_REJECTED",
    title: "Tax Refund Verification Update",
    message: `Your tax refund verification requires attention.${reason}`,
    taxRefundId,
  });
}

export async function notifyLoanApplicationSubmitted(
  userId: string,
  loanApplicationId: string,
  applicationNumber: string,
  productName: string
) {
  await notifyUser({
    userId,
    type: "LOAN_SUBMITTED",
    title: "Loan Application Submitted",
    message: `Your ${productName} application (${applicationNumber}) has been submitted and is under review.`,
    loanApplicationId,
  });
}

export async function notifyLoanDecision(
  userId: string,
  loanApplicationId: string,
  status: "APPROVED" | "REJECTED" | "DISBURSED",
  details: { productName: string; amountLabel?: string; reviewNote?: string | null }
) {
  if (status === "APPROVED") {
    await notifyUser({
      userId,
      type: "LOAN_APPROVED",
      title: "Loan Application Approved",
      message: `Your ${details.productName} application has been approved for ${details.amountLabel ?? "the requested amount"}. Funds will be disbursed after final processing.`,
      loanApplicationId,
    });
    return;
  }
  if (status === "DISBURSED") {
    await notifyUser({
      userId,
      type: "LOAN_DISBURSED",
      title: "Loan Funds Disbursed",
      message: `Your ${details.productName} loan of ${details.amountLabel ?? "approved funds"} has been disbursed to your account.`,
      loanApplicationId,
    });
    return;
  }
  const reason = details.reviewNote?.trim() ? ` Reason: ${details.reviewNote}` : "";
  await notifyUser({
    userId,
    type: "LOAN_REJECTED",
    title: "Loan Application Not Approved",
    message: `Your ${details.productName} loan application was not approved.${reason}`,
    loanApplicationId,
  });
}

export async function notifyAdminsTaxRefundSubmitted(userName: string, applicationNumber: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) return;
  const mail = userNotificationEmail({
    name: "Admin",
    title: "New Tax Refund Verification",
    message: `${userName} submitted tax refund verification ${applicationNumber}. Review it in the admin console.`,
    siteUrl: `${getSiteUrl()}/admin/tax-verifications`,
  });
  try {
    await sendEmail({ to: adminEmail, ...mail });
  } catch (e) {
    console.error("Admin tax notification email failed:", e);
  }
}

export async function notifyAdminsLoanSubmitted(userName: string, applicationNumber: string, productName: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) return;
  const mail = userNotificationEmail({
    name: "Admin",
    title: "New Loan Application",
    message: `${userName} applied for ${productName} (${applicationNumber}). Review in loan management.`,
    siteUrl: `${getSiteUrl()}/admin/loans`,
  });
  try {
    await sendEmail({ to: adminEmail, ...mail });
  } catch (e) {
    console.error("Admin loan notification email failed:", e);
  }
}

export async function getUserName(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return user?.name ?? "Customer";
}
