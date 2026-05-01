import { prisma } from "@/db/prisma";
import { logger } from "@/config/logger.config";
import { v4 as uuidv4 } from "uuid";
import { RegisterShopRequest } from "@/types/dto/shop.dto";
import { sendAdminApprovalEmail, sendUserPaymentLinkEmail } from "@/services/email/email.service";
import { verifyPaymentIntent } from "@/services/stripe/stripe.service";
import { generateUniqueShopCode } from "@/services/shop/shop.service";
import bcrypt from "bcrypt";

export const createRegistrationRequest = async (data: RegisterShopRequest) => {
  logger.info(`[RegistrationService] Creating request for shop: ${data.shop_name}`);

  // Check if email already exists in users or pending requests
  const existingUser = await prisma.user.findUnique({ where: { email: data.owner.email } });
  if (existingUser) throw { status: 400, message: "Email already registered" };

  const approvalToken = uuidv4();

  const request = await prisma.registrationRequest.create({
    data: {
      shopName: data.shop_name,
      ownerEmail: data.owner.email,
      ownerName: data.owner.name,
      fullData: data as any,
      approvalToken,
      status: "PENDING"
    }
  });

  try {
    await sendAdminApprovalEmail(request);
    logger.info(`[RegistrationService] Admin notification sent for request: ${request.id}`);
  } catch (error) {
    logger.error(`[RegistrationService] Failed to send admin email: ${error}`);
  }

  return { requestId: request.id, status: request.status };
};

export const approveRegistrationRequest = async (token: string) => {
  logger.info(`[RegistrationService] Approving request with token: ${token}`);

  const request = await prisma.registrationRequest.findUnique({
    where: { approvalToken: token }
  });

  if (!request) throw { status: 404, message: "Registration request not found" };
  if (request.status !== "PENDING") throw { status: 400, message: `Request is already ${request.status}` };

  const updatedRequest = await prisma.registrationRequest.update({
    where: { id: request.id },
    data: { status: "APPROVED" }
  });

  try {
    await sendUserPaymentLinkEmail(updatedRequest);
    logger.info(`[RegistrationService] Payment link sent to user: ${request.ownerEmail}`);
  } catch (error) {
    logger.error(`[RegistrationService] Failed to send payment email: ${error}`);
  }

  return { message: "Registration approved successfully" };
};

export const finalizeRegistration = async (requestId: string, paymentIntentId: string) => {
  logger.info(`[RegistrationService] Finalizing registration for request: ${requestId}`);

  const request = await prisma.registrationRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) throw { status: 404, message: "Request not found" };
  if (request.status !== "APPROVED") throw { status: 400, message: "Request must be approved before payment" };

  // Verify Stripe Status (Bypass in TEST mode)
  if (process.env.PAYMENT_MODE === 'TEST') {
    logger.info(`[RegistrationService] MOCK PAYMENT VERIFIED for request: ${requestId}`);
  } else {
    const isPaid = await verifyPaymentIntent(paymentIntentId, requestId);
    if (!isPaid) throw { status: 400, message: "Payment not verified" };
  }

  const data = request.fullData as unknown as RegisterShopRequest;
  const hashedPassword = await bcrypt.hash(data.owner.password, 10);

  // atomic creation
  const result = await prisma.$transaction(async (tx) => {
    const shopCode = await generateUniqueShopCode(tx);
    const tenant = await tx.tenant.create({
      data: { id: data.tenant_id, name: data.shop_name },
    });

    const shop = await tx.shop.create({
      data: { 
        id: data.shop_id, 
        tenantId: data.tenant_id, 
        shopCode,
        name: data.shop_name, 
        brn: data.brn,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        branches: data.branches,
        repairTypes: data.repairTypes || [],
        plan: data.plan
      },
    });

    const user = await tx.user.create({
      data: {
        tenantId: data.tenant_id,
        shopId: data.shop_id,
        fullName: data.owner.name,
        name: data.owner.name,
        email: data.owner.email,
        password: hashedPassword,
        role: "ADMIN",
        isEmailVerified: true // Already verified via this flow effectively
      }
    });

    // Mark request as completed
    await tx.registrationRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED", paymentId: paymentIntentId }
    });

    return { tenant, shop, user };
  });

  return result;
};

export const getRegistrationRequestStatus = async (id: string) => {
  const request = await prisma.registrationRequest.findUnique({
    where: { id },
    select: { id: true, status: true, shopName: true, ownerEmail: true }
  });
  if (!request) throw { status: 404, message: "Request not found" };
  return request;
};

export const resendAdminApprovalEmail = async (id: string) => {
  logger.info(`[RegistrationService] Resending admin notification for request: ${id}`);

  const request = await prisma.registrationRequest.findUnique({
    where: { id }
  });

  if (!request) {
    throw { status: 404, message: "Registration request not found" };
  }

  if (request.status === "COMPLETED") {
    throw { status: 400, message: "This registration has already been completed." };
  }

  try {
    await sendAdminApprovalEmail(request);
    logger.info(`[RegistrationService] Admin notification resent for request: ${id}`);
  } catch (error) {
    logger.error(`[RegistrationService] Failed to resend admin email: ${error}`);
    throw { status: 500, message: "Failed to send admin notification email." };
  }

  return { message: "Admin notification resent successfully" };
};

export const createStaffMember = async (data: any) => {
  logger.info(`[RegistrationService] Creating staff member request for: ${data.email}`);

  // 1. Verify shopId exists
  const shop = await prisma.shop.findUnique({
    where: { id: data.shopId }
  });

  if (!shop) {
    throw { status: 404, message: "Invalid Shop ID provided. Please get the correct Shop ID from your manager." };
  }

  // 2. Check if email exists
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw { status: 400, message: "Email is already registered" };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // 4. Create user linked to shop's tenant and shopId
  const user = await prisma.user.create({
    data: {
      tenantId: shop.tenantId,
      shopId: shop.id,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      password: hashedPassword,
      role: "TECHNICIAN", // default assigned role
      isActive: false, // Must be approved by manager/admin
      isEmailVerified: true
    }
  });

  logger.info(`[RegistrationService] Successfully created staff ${user.id} in shop ${shop.id}`);
  return { message: "Staff registration successful", user: { id: user.id, email: user.email, shopId: user.shopId } };
};
