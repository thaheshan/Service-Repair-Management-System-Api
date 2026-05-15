import { env } from "@/config/env";
import { transporter } from "@/config/email.config";
import { logger } from "@/config/logger.config";
import { Resend } from "resend";

export const MAIL_MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let resendClient: Resend | null | undefined;

function getResend(): Resend | null {
  if (resendClient !== undefined) return resendClient;
  if (!env.RESEND_API_KEY) {
    resendClient = null;
    return null;
  }
  resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

function resolveFromAddress(): string {
  const from = env.EMAIL_FROM || process.env.SMTP_FROM || "";
  if (!from.trim()) {
    throw new Error("EMAIL_FROM or SMTP_FROM must be set for outbound email");
  }
  return from.trim();
}

export type DeliverMailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Resend dashboard tag for filtering */
  flowTag?: string;
};

/**
 * Sends via Resend when RESEND_API_KEY is set; otherwise uses SMTP (nodemailer).
 * Retries transient failures up to MAIL_MAX_RETRIES with backoff.
 */
export async function deliverMail(params: DeliverMailParams): Promise<{ attempts: number }> {
  const { to, subject, html, text, flowTag } = params;
  const resend = getResend();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAIL_MAX_RETRIES; attempt++) {
    try {
      if (resend) {
        const { error } = await resend.emails.send({
          from: resolveFromAddress(),
          to: [to],
          subject,
          html,
          ...(text ? { text } : {}),
        });
        if (error) throw new Error(error.message);
      } else {
        await transporter.sendMail({
          from: resolveFromAddress(),
          to,
          subject,
          html,
          ...(text ? { text } : {}),
        });
      }

      logger.info({
        msg: "email_delivered",
        to,
        subject,
        attempt,
        provider: resend ? "resend" : "smtp",
        ...(flowTag ? { flow: flowTag } : {}),
      });
      return { attempts: attempt };
    } catch (err: unknown) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({
        msg: "email_delivery_attempt_failed",
        to,
        subject,
        attempt,
        maxAttempts: MAIL_MAX_RETRIES,
        error: message,
        ...(flowTag ? { flow: flowTag } : {}),
      });
      if (attempt < MAIL_MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }

  logger.error({
    msg: "email_delivery_exhausted_retries",
    to,
    subject,
    attempts: MAIL_MAX_RETRIES,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    ...(flowTag ? { flow: flowTag } : {}),
  });

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
