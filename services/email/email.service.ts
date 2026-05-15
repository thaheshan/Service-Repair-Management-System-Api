import { env } from "@/config/env";
import { logger } from "@/config/logger.config";
import { prisma } from "@/db/prisma";
import {
  customerRequestConfirmationHtml,
  customerRequestConfirmationText,
  passwordResetEmailHtml,
  passwordResetEmailText,
  verificationEmailHtml,
  verificationEmailText,
} from "@/services/email/email-templates";
import { deliverMail, MAIL_MAX_RETRIES } from "@/services/email/mail.transport";

const VERIFICATION_EXPIRY_MINUTES = 30;
const PASSWORD_RESET_EXPIRY_MINUTES = 30;

function publicApiBase(): string {
  return env.APP_URL.replace(/\/+$/, "");
}

function frontendBase(): string {
  return env.FRONTEND_URL.replace(/\/+$/, "");
}

function verificationVerifyUrl(token: string): string {
  const encoded = encodeURIComponent(token);
  return `${publicApiBase()}/api/v1/users/verify-email?token=${encoded}`;
}

function passwordResetUrl(token: string): string {
  const encoded = encodeURIComponent(token);
  return `${frontendBase()}/reset-password?token=${encoded}`;
}

function resolveRecipientName(fullName?: string | null, fallbackEmail?: string): string {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;
  if (fallbackEmail) return fallbackEmail.split("@")[0] || "there";
  return "there";
}

async function logEmailSent(opts: {
  userId?: string | null;
  email: string;
  type: string;
  attempts: number;
}): Promise<void> {
  await prisma.emailLog.create({
    data: {
      userId: opts.userId ?? null,
      email: opts.email,
      type: opts.type,
      status: "SENT",
      attempts: opts.attempts,
    },
  });
}

async function logEmailFailed(opts: {
  userId?: string | null;
  email: string;
  type: string;
  attempts: number;
  error: string;
}): Promise<void> {
  await prisma.emailLog.create({
    data: {
      userId: opts.userId ?? null,
      email: opts.email,
      type: opts.type,
      status: "FAILED",
      attempts: opts.attempts,
      error: opts.error,
    },
  });
}

/** Visible during integration testing — logs destination only (never secrets). */
function devPreview(kind: string, email: string, url: string): void {
  if (env.NODE_ENV === "production") return;
  logger.debug({
    msg: "email_preview_link",
    kind,
    to: email,
    url,
  });
}

export const sendVerificationEmail = async (userId: string, email: string, token: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, name: true },
  });

  const recipientName = resolveRecipientName(user?.fullName ?? user?.name, email);
  const verifyUrl = verificationVerifyUrl(token);
  devPreview("verification", email, verifyUrl);

  try {
    const { attempts } = await deliverMail({
      to: email,
      subject: "Verify your email — Service Repair Management",
      html: verificationEmailHtml({
        recipientName,
        verifyUrl,
        expiryMinutes: VERIFICATION_EXPIRY_MINUTES,
      }),
      text: verificationEmailText({
        recipientName,
        verifyUrl,
        expiryMinutes: VERIFICATION_EXPIRY_MINUTES,
      }),
      flowTag: "email_verification",
    });

    await logEmailSent({ userId, email, type: "verification", attempts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await logEmailFailed({
      userId,
      email,
      type: "verification",
      attempts: MAIL_MAX_RETRIES,
      error: message,
    });
    throw error;
  }
};

export const sendPasswordResetEmail = async (
  userId: string,
  email: string,
  token: string,
  displayName?: string | null
) => {
  const recipientName = resolveRecipientName(displayName, email);
  const resetUrl = passwordResetUrl(token);
  devPreview("password_reset", email, resetUrl);

  try {
    const { attempts } = await deliverMail({
      to: email,
      subject: "Reset your password — Service Repair Management",
      html: passwordResetEmailHtml({
        recipientName,
        resetUrl,
        expiryMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
      }),
      text: passwordResetEmailText({
        recipientName,
        resetUrl,
        expiryMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
      }),
      flowTag: "forgot_password",
    });

    await logEmailSent({ userId, email, type: "password_reset", attempts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await logEmailFailed({
      userId,
      email,
      type: "password_reset",
      attempts: MAIL_MAX_RETRIES,
      error: message,
    });
    throw error;
  }
};

export type CustomerRequestConfirmationPayload = {
  customerEmail: string;
  customerName: string;
  shopName: string;
  summaryRows: { label: string; value: string }[];
};

export const sendCustomerRequestConfirmationEmail = async (
  payload: CustomerRequestConfirmationPayload
): Promise<void> => {
  const { customerEmail, customerName, shopName, summaryRows } = payload;

  try {
    const { attempts } = await deliverMail({
      to: customerEmail,
      subject: `We received your request — ${shopName}`,
      html: customerRequestConfirmationHtml({
        customerName,
        shopName,
        summaryRows,
      }),
      text: customerRequestConfirmationText({
        customerName,
        shopName,
        summaryRows,
      }),
      flowTag: "customer_request",
    });

    await logEmailSent({
      email: customerEmail,
      type: "customer_request_confirmation",
      attempts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({
      msg: "customer_request_confirmation_email_failed",
      to: customerEmail,
      shopName,
      error: message,
    });
    await logEmailFailed({
      email: customerEmail,
      type: "customer_request_confirmation",
      attempts: MAIL_MAX_RETRIES,
      error: message,
    });
    throw error;
  }
};

export const sendAdminApprovalEmail = async (request: any) => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@futuracareers.tech";
  const approveUrl = `${frontendBase()}/admin/approve-registration?token=${encodeURIComponent(request.approvalToken)}`;
  const fullData = request.fullData;

  logger.debug({
    msg: "email_preview_link",
    kind: "admin_approval",
    to: adminEmail,
    url: approveUrl,
  });

  await deliverMail({
    to: adminEmail,
    subject: `New registration request: ${request.shopName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4F46E5;">New shop registration request</h2>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Shop name:</strong> ${request.shopName}</p>
          <p><strong>Owner name:</strong> ${request.ownerName}</p>
          <p><strong>Owner email:</strong> ${request.ownerEmail}</p>
          <p><strong>Location:</strong> ${fullData.city}, ${fullData.country}</p>
          <p><strong>Phone:</strong> ${fullData.phone}</p>
          <p><strong>Plan:</strong> ${fullData.plan}</p>
        </div>
        <p>Please review the details and click below to approve this registration.</p>
        <div style="margin-top: 30px;">
          <a href="${approveUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Approve registration</a>
        </div>
      </div>
    `,
    flowTag: "admin_registration",
  });
};

export const sendPaymentConfirmationEmail = async (
  userId: string,
  email: string,
  amount: number,
  plan: string
) => {
  try {
    const { attempts } = await deliverMail({
      to: email,
      subject: "Payment confirmation — Service Repair Management",
      html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4F46E5;">Payment received</h2>
            <p style="color: #374151;">We have successfully received your payment of <b>LKR ${amount}</b>.</p>
            <p style="color: #374151;">Your subscription plan <b>${plan}</b> is now active.</p>
            <p style="color: #374151;">Thank you for choosing Service Repair Management!</p>
          </div>
        `,
      flowTag: "payment_confirmation",
    });

    await logEmailSent({
      userId,
      email,
      type: "payment_confirmation",
      attempts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({
      msg: "payment_confirmation_email_failed",
      userId,
      to: email,
      error: message,
    });
    await logEmailFailed({
      userId,
      email,
      type: "payment_confirmation",
      attempts: MAIL_MAX_RETRIES,
      error: message,
    });

    throw error;
  }
};

export const sendUserPaymentLinkEmail = async (request: any) => {
  const paymentUrl = `${frontendBase()}/registration/payment?requestId=${encodeURIComponent(request.id)}`;

  logger.debug({
    msg: "email_preview_link",
    kind: "registration_payment",
    to: request.ownerEmail,
    url: paymentUrl,
  });

  await deliverMail({
    to: request.ownerEmail,
    subject: "Registration approved — payment required",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Good news — your registration is approved.</h2>
        <p style="color: #374151;">To complete your registration for <strong>${request.shopName}</strong>, please proceed to the payment of 25 LKR.</p>
        <div style="margin: 32px 0;">
          <a href="${paymentUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Proceed to payment</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Once payment is confirmed, your account will be activated immediately.</p>
      </div>
    `,
    flowTag: "registration_payment_link",
  });
};
