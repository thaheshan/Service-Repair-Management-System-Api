import { prisma } from "@/db/prisma";
import type { UpdateSettingsInput } from "@/validators/settings/settings.validator";

export type ShopSettingsResponse = {
  shopName: string;
  currency: string;
  taxPercentage: number;
  notificationsEnabled: boolean;
};

export const getShopSettings = async (
  tenantId: string,
  shopId: string,
): Promise<ShopSettingsResponse> => {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, tenantId },
    select: {
      name: true,
      currency: true,
      taxPercentage: true,
      notificationsEnabled: true,
    },
  });

  if (!shop) {
    throw { status: 404, code: "NOT_FOUND" };
  }

  return {
    shopName: shop.name,
    currency: shop.currency,
    taxPercentage: shop.taxPercentage,
    notificationsEnabled: shop.notificationsEnabled,
  };
};

export const updateShopSettings = async (
  tenantId: string,
  shopId: string,
  data: UpdateSettingsInput,
): Promise<void> => {
  const updatePayload: Record<string, unknown> = {};
  if (data.shopName !== undefined) updatePayload.name = data.shopName;
  if (data.currency !== undefined) updatePayload.currency = data.currency.trim().toUpperCase();
  if (data.taxPercentage !== undefined) updatePayload.taxPercentage = data.taxPercentage;
  if (data.notificationsEnabled !== undefined) {
    updatePayload.notificationsEnabled = data.notificationsEnabled;
  }

  const existing = await prisma.shop.findFirst({
    where: { id: shopId, tenantId },
    select: { id: true },
  });
  if (!existing) {
    throw { status: 404, code: "NOT_FOUND" };
  }

  try {
    await prisma.shop.update({
      where: { id: shopId },
      data: updatePayload as any,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, code: "NOT_FOUND" };
    }
    throw error;
  }
};
