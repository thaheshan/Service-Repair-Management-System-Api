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