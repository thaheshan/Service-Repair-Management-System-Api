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

const isValidRequestSource = (context: StaffAuthContextDto) => {
  return context.request_source === env.STAFF_REGISTRATION_SOURCE;
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
    return new ApiError(403, "User already registered to a shop");
  }

  return new ApiError(500, "Unexpected failure");
};

export const validateShopIdService = async (
  payload: ValidateShopIdRequestDto,
  context: StaffAuthContextDto,
): Promise<ValidateShopIdResponseDto> => {
  if (!isValidRequestSource(context)) {
    throw new ApiError(401, "Invalid request source");
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
  if (!isValidRequestSource(context)) {
    throw new ApiError(401, "Invalid request source");
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const shop = await tx.shop.findUnique({
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

      const existingUser = await tx.user.findFirst({
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

      const user = await tx.user.create({
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
        staff: {
          ...user,
          role: user.role as JwtRole,
        },
        access_token: accessToken,
      };
    });

    return result;
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
