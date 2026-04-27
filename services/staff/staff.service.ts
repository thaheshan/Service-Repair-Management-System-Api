import { env } from "@/config/env";
import { prisma } from "@/db/prisma";
import { ApiError } from "@/utils/common.util";
import { signAccessToken, type JwtRole } from "@/utils/jwt.util";
import type {
  RegisterStaffRequestDto,
  RegisterStaffResponseDto,
  StaffAuthContextDto,
  StaffDashboardContextDto,
  ValidateShopIdRequestDto,
  ValidateShopIdResponseDto,
} from "@/types/dto/staff.dto";
import bcrypt from "bcrypt";
import crypto from "crypto";

const STAFF_SIGNATURE_TTL_MS = 5 * 60 * 1000;

const stableStringify = (payload: Record<string, unknown>) => {
  return JSON.stringify(payload, Object.keys(payload).sort());
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const isValidRequestSource = (
  context: StaffAuthContextDto,
  payload: unknown,
) => {
  if (!context.request_signature || !context.request_timestamp) {
    return false;
  }

  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (context.request_source && context.request_source !== env.STAFF_REGISTRATION_SOURCE) {
    return false;
  }

  const timestamp = Number(context.request_timestamp);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  if (Math.abs(Date.now() - timestamp) > STAFF_SIGNATURE_TTL_MS) {
    return false;
  }

  const signingPayload = `${timestamp}.${stableStringify(payload as Record<string, unknown>)}`;
  const expected = crypto
    .createHmac("sha256", env.STAFF_REGISTRATION_SECRET)
    .update(signingPayload)
    .digest("hex");

  return safeEqual(expected, context.request_signature);
};

const normalizeError = (error: unknown) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  ) {
    const meta = (error as { meta?: { target?: string | string[] } }).meta;
    const target = Array.isArray(meta?.target) ? meta?.target : meta?.target ? [meta.target] : [];

    if (target.includes("phone")) {
      return new ApiError(409, "Phone number already registered");
    }

    if (target.includes("email")) {
      return new ApiError(409, "Email already registered");
    }

    return new ApiError(409, "Unique constraint violation");
  }

  return new ApiError(500, "Unexpected failure");
};

export const validateShopIdService = async (
  payload: ValidateShopIdRequestDto,
  context: StaffAuthContextDto,
): Promise<ValidateShopIdResponseDto> => {
  if (!isValidRequestSource(context, payload)) {
    throw new ApiError(401, "Invalid request signature");
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { shopCode: payload.shop_id },
      select: { id: true, shopCode: true, isActive: true, acceptsStaffRegistrations: true },
    });

    if (!shop) {
      throw new ApiError(400, "Invalid Shop ID");
    }

    if (!shop.isActive || !shop.acceptsStaffRegistrations) {
      throw new ApiError(403, "Shop disabled or registration locked");
    }

    return { shop_id: shop.shopCode };
  } catch (error) {
    throw normalizeError(error);
  }
};

export const registerStaffService = async (
  payload: RegisterStaffRequestDto,
  context: StaffAuthContextDto,
): Promise<RegisterStaffResponseDto> => {
  if (!isValidRequestSource(context, payload)) {
    throw new ApiError(401, "Invalid request signature");
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { shopCode: payload.shop_id },
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

    const existingUser = await prisma.user.findFirst({
      where: { phone: payload.phone },
      select: { id: true, shopId: true },
    });

    if (existingUser?.shopId && existingUser.shopId !== shop.id) {
      throw new ApiError(403, "User already registered to another shop");
    }

    if (existingUser?.shopId === shop.id) {
      throw new ApiError(403, "User already registered to this shop");
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        fullName: payload.full_name,
        phone: payload.phone,
        password: hashedPassword,
        role: payload.role,
        tenantId: shop.tenantId,
        shopId: shop.id,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
          email: true,
        phone: true,
        role: true,
        tenantId: true,
        shopId: true,
        isActive: true,
        createdAt: true,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email ?? "",
      role: user.role as JwtRole,
      shopId: user.shopId,
      tenantId: user.tenantId,
    });

    return {
      staff: {
        ...user,
        role: user.role as JwtRole,
      },
      access_token: accessToken,
    };
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getStaffDashboardContextService = async (
  userId: string,
): Promise<StaffDashboardContextDto | null> => {
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
    return null;
  }

  return {
    ...user,
    role: user.role as JwtRole,
  };
};
