import { env } from "@/config/env";
import { prisma } from "@/db/prisma";
import { randomToken, sha256Base64Url } from "@/utils/crypto.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt.util";
import bcrypt from "bcrypt";

import { sendPasswordResetEmail } from "@/services/email/email.service";
import { v4 as uuidv4 } from "uuid";

const BCRYPT_ROUNDS = 12;

type TokenUser = {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  shopId: string | null;
};

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
    default:
      return value * 24 * 60 * 60 * 1000;
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function createTokensForUser(user: TokenUser) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role as any,
    tenantId: user.tenantId,
    shopId: user.shopId,
  });

  const jti = randomToken(16);
  const refreshToken = signRefreshToken({
    sub: user.id,
    jti,
  });

  const tokenHash = sha256Base64Url(refreshToken);

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash,
      tenantId: user.tenantId,
      shopId: user.shopId,
      expiresAt: new Date(Date.now() + parseExpiry(env.REFRESH_TOKEN_EXPIRY)),
    },
  });

  return { accessToken, refreshToken };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const tokens = await createTokensForUser({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    shopId: user.shopId,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      shopId: user.shopId,
    },
    tokens,
  };
}

export async function refreshSession(refreshToken: string) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: "Invalid or expired refresh token" };
  }

  const tokenHash = sha256Base64Url(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { id: decoded.jti },
    include: { user: true },
  });

  if (!stored || stored.tokenHash !== tokenHash || stored.revokedAt || stored.expiresAt < new Date()) {
    throw { status: 401, message: "Refresh token is no longer valid" };
  }

  const user = stored.user;
  const tokens = await createTokensForUser({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    shopId: user.shopId,
  });

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      shopId: user.shopId,
    },
    tokens,
  };
}

export async function logoutSession(refreshToken: string): Promise<void> {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: decoded.jti },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Keep logout idempotent even for invalid/expired tokens.
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, tenantId: true, shopId: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return user;
}

export async function createInitialAdminUser(email: string, password: string, tenantName: string) {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    throw { status: 409, message: "Admin user already exists" };
  }

  const tenant = await prisma.tenant.create({
    data: { name: tenantName },
  });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role: "ADMIN",
      tenantId: tenant.id,
    },
    select: { id: true, email: true, role: true, tenantId: true, shopId: true, createdAt: true },
  });

  return user;
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Return early to avoid account enumeration, but don't throw error for non-existent users
    return;
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  await sendPasswordResetEmail(user.id, user.email, token);
}

export async function completePasswordReset(token: string, newPassword: string) {
  const storedToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!storedToken || storedToken.used || storedToken.expiresAt < new Date()) {
    throw { status: 400, message: "Invalid or expired reset token" };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: storedToken.userId },
      data: { password: passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: storedToken.id },
      data: { used: true },
    }),
  ]);
}
