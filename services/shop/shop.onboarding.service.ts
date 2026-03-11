import { prisma } from "@/db/prisma";
import { sendVerificationEmail } from "@/services/email.service";
import {
  GenerateShopIdsRequest,
  GenerateShopIdsResponse,
  RegisterShopRequest,
  RegisterShopResponse,
} from "@/types/dto/shop.dto";
import { logger } from "@/config/logger.config";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export const generateShopIdsService = async (
  data: GenerateShopIdsRequest
): Promise<GenerateShopIdsResponse> => {
  const { shop_name, owner_email } = data;

  logger.info(`[generateShopIdsService] -> Checking duplicate email: ${owner_email}`);

  const existingUser = await prisma.user.findUnique({
    where: { email: owner_email },
  });

  if (existingUser) {
    logger.warn(`[generateShopIdsService] -> Email already registered: ${owner_email}`);
    throw { status: 400, message: "Email already registered" };
  }

  const shop_id = uuidv4();
  const tenant_id = uuidv4();

  logger.info(`[generateShopIdsService] -> Validating ID uniqueness for shop: ${shop_name}`);

  const existingTenant = await prisma.tenant.findUnique({ where: { id: tenant_id } });
  const existingShop = await prisma.shop.findUnique({ where: { id: shop_id } });

  if (existingTenant || existingShop) {
    logger.error(`[generateShopIdsService] -> ID collision detected`);
    throw { status: 400, message: "ID collision detected, please retry" };
  }

  logger.info(`[generateShopIdsService] -> IDs generated successfully for shop: ${shop_name}`);

  return { shop_id, tenant_id };
};

export const registerShopService = async (
  data: RegisterShopRequest
): Promise<RegisterShopResponse> => {
  const { shop_id, tenant_id, shop_name, brn, owner } = data;

  logger.info(`[registerShopService] -> Starting registration for shop: ${shop_name}`);

  const hashedPassword = await bcrypt.hash(owner.password, 10);

  logger.info(`[registerShopService] -> Starting atomic transaction`);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { id: tenant_id, name: shop_name },
    });

    const shop = await tx.shop.create({
      data: { id: shop_id, tenantId: tenant_id, name: shop_name, brn },
    });

    const user = await tx.user.create({
      data: {
        tenantId: tenant_id,
        shopId: shop_id,
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

  logger.info(`[registerShopService] -> Transaction successful, creating verification token`);

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId: result.user.id, token, expiresAt },
  });

  try {
    await sendVerificationEmail(result.user.id, owner.email, token);
    logger.info(`[registerShopService] -> Verification email sent to: ${owner.email}`);
  } catch (emailError) {
    logger.error(`[registerShopService] -> Failed to send verification email to: ${owner.email}`);
  }

  return result;
};

export const sendVerificationService = async (
  user_id: string,
  email: string
): Promise<void> => {
  logger.info(`[sendVerificationService] -> Looking up user: ${user_id}`);

  const user = await prisma.user.findUnique({ where: { id: user_id } });

  if (!user) {
    logger.warn(`[sendVerificationService] -> User not found: ${user_id}`);
    throw { status: 400, message: "User not found" };
  }

  logger.info(`[sendVerificationService] -> Invalidating old tokens for user: ${user_id}`);

  await prisma.emailVerificationToken.updateMany({
    where: { userId: user_id, used: false },
    data: { used: true },
  });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId: user_id, token, expiresAt },
  });

  logger.info(`[sendVerificationService] -> Sending verification email to: ${email}`);

  await sendVerificationEmail(user_id, email, token);

  logger.info(`[sendVerificationService] -> Verification email sent successfully to: ${email}`);
};
export const verifyEmailService = async (token: string): Promise<void> => {
  logger.info(`[verifyEmailService] -> Looking up token`);

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    logger.warn(`[verifyEmailService] -> Token not found`);
    throw { status: 400, message: "Invalid verification token" };
  }

  if (verificationToken.used) {
    logger.warn(`[verifyEmailService] -> Token already used`);
    throw { status: 400, message: "Token already used" };
  }

  if (verificationToken.expiresAt < new Date()) {
    logger.warn(`[verifyEmailService] -> Token expired`);
    throw { status: 400, message: "Token expired" };
  }

  logger.info(`[verifyEmailService] -> Token valid, verifying user`);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: verificationToken.userId },
      data: { isEmailVerified: true },
    });

    await tx.emailVerificationToken.update({
      where: { token },
      data: { used: true },
    });
  });

  logger.info(`[verifyEmailService] -> Email verified successfully`);
};