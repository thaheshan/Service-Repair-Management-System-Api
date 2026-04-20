import { prisma } from "@/db/prisma";
import { transporter } from "@/config/email.config";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendVerificationEmail = async (
  userId: string,
  email: string,
  token: string
) => {
  const verificationUrl = `${process.env.APP_URL}/api/users/verify-email?token=${token}`;
  let attempts = 0;
  let lastError: any = null;

  while (attempts < MAX_RETRIES) {
    attempts++;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Verify your email - SRM",
        html: `
          <h2>Email Verification</h2>
          <p>Click the link below to verify your email. This link expires in 30 minutes.</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
        `,
      });

      await prisma.emailLog.create({
        data: { userId, email, type: "verification", status: "SENT", attempts },
      });

      return;
    } catch (error: any) {
      lastError = error;
      console.error(`Email attempt ${attempts} failed:`, error.message);
      if (attempts < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }

  await prisma.emailLog.create({
    data: {
      userId,
      email,
      type: "verification",
      status: "FAILED",
      attempts,
      error: lastError?.message ?? "Unknown error",
    },
  });

  throw lastError;
};

export const sendPaymentConfirmationEmail = async (
  userId: string,
  email: string,
  amount: number,
  plan: string
) => {
  let attempts = 0;
  let lastError: any = null;

  while (attempts < MAX_RETRIES) {
    attempts++;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Payment Confirmation - SRM",
        html: `
          <h2>Payment Received</h2>
          <p>We have successfully received your payment of <b>LKR ${amount}</b>.</p>
          <p>Your subscription plan <b>${plan}</b> is now active.</p>
          <p>Thank you for choosing Service Repair Management System!</p>
        `,
      });

      await prisma.emailLog.create({
        data: { userId, email, type: "payment_confirmation", status: "SENT", attempts },
      });

      return;
    } catch (error: any) {
      lastError = error;
      console.error(`Payment confirmation email attempt ${attempts} failed:`, error.message);
      if (attempts < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }

  await prisma.emailLog.create({
    data: {
      userId,
      email,
      type: "payment_confirmation",
      status: "FAILED",
      attempts,
      error: lastError?.message ?? "Unknown error",
    },
  });
};