import { prisma } from "@/db/prisma";
import { env } from "@/config/env";
import { randomToken, sha256Base64Url } from "@/utils/crypto.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt.util";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";

const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

type AuthUser = {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";
  tenantId: string;
  shopId: string | null;
};

type AuthRequest = Request & { user?: AuthUser };

async function createTokensForUser(user: { id: string; email: string; role: string; tenantId: string; shopId: string | null }) {
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

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const tokens = await createTokensForUser({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    shopId: user.shopId,
  });

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        shopId: user.shopId,
      },
      tokens,
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "refreshToken is required" });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }

  const tokenHash = sha256Base64Url(refreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { id: decoded.jti },
    include: { user: true },
  });

  if (!stored || stored.tokenHash !== tokenHash || stored.revokedAt || stored.expiresAt < new Date()) {
    return res.status(401).json({ success: false, message: "Refresh token is no longer valid" });
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

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        shopId: user.shopId,
      },
      tokens,
    },
  });
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "refreshToken is required" });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(200).json({ success: true, message: "Logged out" });
  }

  await prisma.refreshToken.updateMany({
    where: { id: decoded.jti },
    data: { revokedAt: new Date() },
  });

  return res.status(200).json({ success: true, message: "Logged out" });
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, role: true, tenantId: true, shopId: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({ success: true, data: user });
};

export const createInitialAdmin = async (req: Request, res: Response) => {
  const { email, password, tenantName } = req.body as { email?: string; password?: string; tenantName?: string };
  if (!email || !password || !tenantName) {
    return res.status(400).json({ success: false, message: "email, password and tenantName are required" });
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    return res.status(409).json({ success: false, message: "Admin user already exists" });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
    },
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

  return res.status(201).json({ success: true, data: user });
};

