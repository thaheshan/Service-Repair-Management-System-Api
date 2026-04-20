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
  
  // ALWAYS Log to console for development convenience
  console.log("\n-------------------------------------------");
  console.log("🛠️  [DEV] EMAIL VERIFICATION LINK GENERATED");
  console.log(`📧 To: ${email}`);
  console.log(`🔗 Link: ${verificationUrl}`);
  console.log("-------------------------------------------\n");

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
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4F46E5; margin-bottom: 24px;">Welcome to SRM!</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Thank you for registering. Please verify your email address to activate your account.</p>
            <div style="margin: 32px 0;">
              <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email Address</a>
            </div>
          </div>
        `,
      });
      await prisma.emailLog.create({ data: { userId, email, type: "verification", status: "SENT", attempts } });
      return;
    } catch (error: any) {
      lastError = error;
      if (attempts < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
};

export const sendPasswordResetEmail = async (
  userId: string,
  email: string,
  token: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  // ALWAYS Log to console for development convenience
  console.log("\n-------------------------------------------");
  console.log("🛠️  [DEV] PASSWORD RESET LINK GENERATED");
  console.log(`📧 To: ${email}`);
  console.log(`🔗 Link: ${resetUrl}`);
  console.log("-------------------------------------------\n");

  let attempts = 0;
  let lastError: any = null;

  while (attempts < MAX_RETRIES) {
    attempts++;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Reset your password - SRM",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4F46E5; margin-bottom: 24px;">Password Reset Request</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Click the button below to set a new password. This link expires in 30 minutes.</p>
            <div style="margin: 32px 0;">
              <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
          </div>
        `,
      });
      return;
    } catch (error: any) {
      lastError = error;
      if (attempts < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
};

export const sendAdminApprovalEmail = async (request: any) => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@futuracareers.tech";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const approveUrl = `${frontendUrl}/admin/approve-registration?token=${request.approvalToken}`;
  const fullData = request.fullData;

  console.log("\n-------------------------------------------");
  console.log("🛠️  [DEV] ADMIN APPROVAL LINK GENERATED");
  console.log(`📧 To Admin: ${adminEmail}`);
  console.log(`🔗 Approve Link: ${approveUrl}`);
  console.log("-------------------------------------------\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: adminEmail,
    subject: `New Registration Request: ${request.shopName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4F46E5;">New Shop Registration Request</h2>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Shop Name:</strong> ${request.shopName}</p>
          <p><strong>Owner Name:</strong> ${request.ownerName}</p>
          <p><strong>Owner Email:</strong> ${request.ownerEmail}</p>
          <p><strong>Location:</strong> ${fullData.city}, ${fullData.country}</p>
          <p><strong>Phone:</strong> ${fullData.phone}</p>
          <p><strong>Plan:</strong> ${fullData.plan}</p>
        </div>
        <p>Please review the details and click below to approve this registration.</p>
        <div style="margin-top: 30px;">
          <a href="${approveUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Approve Registration</a>
        </div>
      </div>
    `,
  });
};

export const sendUserPaymentLinkEmail = async (request: any) => {
  const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/registration/payment?requestId=${request.id}`;

  console.log("\n-------------------------------------------");
  console.log("🛠️  [DEV] USER PAYMENT LINK GENERATED");
  console.log(`📧 To User: ${request.ownerEmail}`);
  console.log(`🔗 Payment Link: ${paymentUrl}`);
  console.log("-------------------------------------------\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: request.ownerEmail,
    subject: "Registration Approved - Payment Required",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Good news! Your registration is approved.</h2>
        <p style="color: #374151;">To complete your registration for <strong>${request.shopName}</strong>, please proceed to the payment of 25 LKR.</p>
        <div style="margin: 32px 0;">
          <a href="${paymentUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Proceed to Payment</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Once payment is confirmed, your account will be activated immediately.</p>
      </div>
    `,
  });
};