import { prisma } from "@/db/prisma";
import { sendVerificationEmail } from "@/services/email/email.service";
import {
  GenerateShopIdsRequest,
  GenerateShopIdsResponse,
  RegisterShopRequest,
  RegisterShopResponse,
} from "@/types/dto/shop.dto";
import { logger } from "@/config/logger.config";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export const createShopIds = async (
  data: GenerateShopIdsRequest
): Promise<GenerateShopIdsResponse> => {
  const { shop_name, owner_email } = data;

  logger.info(`[createShopIds] -> Checking duplicate email: ${owner_email}`);

  const existingUser = await prisma.user.findUnique({
    where: { email: owner_email },
  });

  if (existingUser) {
    logger.warn(`[createShopIds] -> Email already registered: ${owner_email}`);
    throw { status: 400, message: "Email already registered" };
  }

  const shop_id = uuidv4();
  const tenant_id = uuidv4();

  logger.info(`[createShopIds] -> Validating ID uniqueness for shop: ${shop_name}`);

  const existingTenant = await prisma.tenant.findUnique({ where: { id: tenant_id } });
  const existingShop = await prisma.shop.findUnique({ where: { id: shop_id } });

  if (existingTenant || existingShop) {
    logger.error(`[createShopIds] -> ID collision detected`);
    throw { status: 400, message: "ID collision detected, please retry" };
  }

  logger.info(`[createShopIds] -> IDs generated successfully for shop: ${shop_name}`);

  return { shop_id, tenant_id };
};

export const shopRegister = async (
  data: RegisterShopRequest
): Promise<RegisterShopResponse> => {
  const {
    shop_id,
    tenant_id,
    shop_name,
    businessRegistration,
    address,
    city,
    phone,
    plan,
    owner,
  } = data;

  logger.info(`[shopRegister] -> Starting registration for shop: ${shop_name}`);

  const hashedPassword = await bcrypt.hash(owner.password, 10);

  logger.info(`[shopRegister] -> Starting atomic transaction`);

  const result = await prisma.$transaction(async (tx: any) => {
    const tenant = await tx.tenant.create({
      data: { id: tenant_id, name: shop_name },
    });

    const shop = await tx.shop.create({
      data: {
        id: shop_id,
        tenantId: tenant_id,
        name: shop_name,
        businessRegistration,
        address,
        city,
        phone,
        subscriptionPlan: plan as any,
      },
    });

    const user = await tx.user.create({
      data: {
        tenantId: tenant_id,
        shopId: shop_id,
        name: owner.name,
        email: owner.email,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        shopId: true,
      },
    });

    return { tenant, shop, user };
  });

  logger.info(`[shopRegister] -> Transaction successful, creating verification token`);

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId: result.user.id, token, expiresAt },
  });

  try {
    await sendVerificationEmail(result.user.id, owner.email, token);
    logger.info(`[shopRegister] -> Verification email sent to: ${owner.email}`);
  } catch (emailError) {
    logger.error(`[shopRegister] -> Failed to send verification email to: ${owner.email}`);
  }

  return result;
};

export const sendEmailVerification = async (
  user_id: string,
  email: string
): Promise<void> => {
  logger.info(`[sendEmailVerification] -> Looking up user: ${user_id}`);

  const user = await prisma.user.findUnique({ where: { id: user_id } });

  if (!user) {
    logger.warn(`[sendEmailVerification] -> User not found: ${user_id}`);
    throw { status: 400, message: "User not found" };
  }

  logger.info(`[sendEmailVerification] -> Invalidating old tokens for user: ${user_id}`);

  await prisma.emailVerificationToken.updateMany({
    where: { userId: user_id, used: false },
    data: { used: true },
  });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId: user_id, token, expiresAt },
  });

  logger.info(`[sendEmailVerification] -> Sending verification email to: ${email}`);

  await sendVerificationEmail(user_id, email, token);

  logger.info(`[sendEmailVerification] -> Verification email sent successfully to: ${email}`);
};

export const validateEmailToken = async (token: string): Promise<void> => {
  logger.info(`[validateEmailToken] -> Looking up token`);

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    logger.warn(`[validateEmailToken] -> Token not found`);
    throw { status: 400, message: "Invalid verification token" };
  }

  if (verificationToken.used) {
    logger.warn(`[validateEmailToken] -> Token already used`);
    throw { status: 400, message: "Token already used" };
  }

  if (verificationToken.expiresAt < new Date()) {
    logger.warn(`[validateEmailToken] -> Token expired`);
    throw { status: 400, message: "Token expired" };
  }

  logger.info(`[validateEmailToken] -> Token valid, verifying user`);

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: verificationToken.userId },
      data: { isEmailVerified: true },
    });

    await tx.emailVerificationToken.update({
      where: { token },
      data: { used: true },
    });
  });

  logger.info(`[validateEmailToken] -> Email verified successfully`);
};

export const getTenantShops = async (tenantId: string) => {
  return prisma.shop.findMany({
    where: { tenantId },
  });
};

export const getTenantShopById = async (id: string, tenantId: string) => {
  const shop = await prisma.shop.findFirst({
    where: { id, tenantId },
  });

  if (!shop) {
    throw { status: 404, message: "Shop not found" };
  }

  return shop;
};

export const createTenantShop = async (
  tenantId: string,
  data: { name: string; address?: string; phone?: string }
) => {
  return prisma.shop.create({
    data: {
      tenantId,
      name: data.name,
      address: data.address,
      phone: data.phone,
    },
  });
};

export const updateTenantShop = async (
  id: string,
  tenantId: string,
  data: { name?: string; address?: string; phone?: string }
) => {
  try {
    return await prisma.shop.update({
      where: { id, tenantId },
      data,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, message: "Shop not found" };
    }
    throw error;
  }
};

export const deleteTenantShop = async (id: string, tenantId: string): Promise<void> => {
  try {
    await prisma.shop.delete({
      where: { id, tenantId },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, message: "Shop not found" };
    }
    throw error;
  }
};