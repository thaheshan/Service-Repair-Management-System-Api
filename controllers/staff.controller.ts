import { env } from "@/config/env";
import { prisma } from "@/db/prisma";
import type { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { ApiError } from "@/utils/common.util";
import { signAccessToken, type JwtRole } from "@/utils/jwt.util";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

const STAFF_ROLES: JwtRole[] = ["TECHNICIAN", "MANAGER"];

const parseStaffRole = (value: unknown): JwtRole | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (STAFF_ROLES.includes(normalized as JwtRole)) {
    return normalized as JwtRole;
  }

  return null;
};

const isValidRequestSource = (req: Request) => {
  const sourceHeader = req.header("x-request-source");
  return sourceHeader === env.STAFF_REGISTRATION_SOURCE;
};

const resolveApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new ApiError(403, "User already registered to a shop");
  }

  return new ApiError(500, "Unexpected failure");
};

export const validateShopId = async (req: Request, res: Response) => {
  try {
    if (!isValidRequestSource(req)) {
      return res.status(401).json({ success: false, message: "Invalid request source" });
    }

    const shopId = String(req.body?.shop_id ?? "").trim();
    if (!shopId) {
      return res.status(400).json({ success: false, message: "shop_id is required" });
    }

    const shop = await prisma.shop.findUnique({
      where: { shopCode: shopId },
      select: { id: true, shopCode: true, isActive: true, acceptsStaffRegistrations: true },
    });

    if (!shop) {
      return res.status(400).json({ success: false, message: "Invalid Shop ID" });
    }

    if (!shop.isActive || !shop.acceptsStaffRegistrations) {
      return res.status(403).json({ success: false, message: "Shop disabled or registration locked" });
    }

    return res.status(200).json({
      success: true,
      message: "Shop valid",
      data: { shop_id: shop.shopCode },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Validation failure" });
  }
};

export const registerStaff = async (req: Request, res: Response) => {
  try {
    if (!isValidRequestSource(req)) {
      return res.status(401).json({ success: false, message: "Invalid request source" });
    }

    const fullName = String(req.body?.full_name ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim();
    const password = String(req.body?.password ?? "");
    const shopCode = String(req.body?.shop_id ?? "").trim();
    const role = parseStaffRole(req.body?.role);

    if (!fullName || !phone || !password || !shopCode || !role) {
      return res.status(400).json({
        success: false,
        message: "full_name, phone, password, shop_id and valid role are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.findUnique({
        where: { shopCode },
        select: {
          id: true,
          shopCode: true,
          tenantId: true,
          isActive: true,
          acceptsStaffRegistrations: true,
        },
      });

      if (!shop) {
        throw new ApiError(400, "Invalid Shop ID");
      }

      if (!shop.isActive || !shop.acceptsStaffRegistrations) {
        throw new ApiError(403, "Shop disabled or registration locked");
      }

      const existingUser = await tx.user.findFirst({
        where: { phone },
        select: { id: true, shopId: true, role: true },
      });

      if (existingUser?.shopId && existingUser.shopId !== shop.id) {
        throw new ApiError(403, "User already registered to another shop");
      }

      if (existingUser?.shopId === shop.id) {
        throw new ApiError(403, "User already registered to this shop");
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await tx.user.create({
        data: {
          fullName,
          phone,
          password: hashedPassword,
          role,
          tenantId: shop.tenantId,
          shopId: shop.id,
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          role: true,
          tenantId: true,
          shopId: true,
          isActive: true,
          createdAt: true,
        },
      });

      const accessToken = signAccessToken({
        user_id: user.id,
        role: user.role as JwtRole,
        shop_id: user.shopId,
        tenant_id: user.tenantId,
      });

      return {
        user,
        shop,
        accessToken,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Staff registered successfully",
      data: {
        staff: result.user,
        access_token: result.accessToken,
      },
    });
  } catch (error) {
    const normalizedError = resolveApiError(error);
    return res.status(normalizedError.statusCode).json({
      success: false,
      message: normalizedError.message,
    });
  }
};

export const getStaffDashboardContext = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Missing access token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        tenantId: true,
        shopId: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff account not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, message: "Unexpected failure" });
  }
};
