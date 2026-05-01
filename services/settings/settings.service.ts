import { prisma } from "@/db/prisma";
import type { Prisma } from "@prisma/client";
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
    include: { settings: true },
  });

  if (!shop) {
    throw { status: 404, code: "NOT_FOUND" };
  }

  return {
    shopName: shop.name,
    currency: shop.settings?.currency ?? "LKR",
    taxPercentage: Number(shop.settings?.taxRate ?? 0),
    notificationsEnabled: !!shop.settings?.notificationPreferences,
  };
};

export const updateShopSettings = async (
  tenantId: string,
  shopId: string,
  data: UpdateSettingsInput,
): Promise<void> => {
  const shopUpdatePayload: Prisma.ShopUpdateInput = {};
  const settingsUpdatePayload: any = {};

  if (data.shopName !== undefined) shopUpdatePayload.name = data.shopName;
  if (data.currency !== undefined) settingsUpdatePayload.currency = data.currency.trim().toUpperCase();
  if (data.taxPercentage !== undefined) settingsUpdatePayload.taxRate = data.taxPercentage;
  // Note: notificationPreferences is Json, we'll just set a simple enabled flag for now if needed
  if (data.notificationsEnabled !== undefined) {
    settingsUpdatePayload.notificationPreferences = { enabled: data.notificationsEnabled };
  }

  const existing = await prisma.shop.findFirst({
    where: { id: shopId, tenantId },
    select: { id: true },
  });
  if (!existing) {
    throw { status: 404, code: "NOT_FOUND" };
  }

  try {
    await prisma.$transaction([
      prisma.shop.update({
        where: { id: shopId },
        data: shopUpdatePayload,
      }),
      prisma.shopSettings.upsert({
        where: { tenantId: shopId }, // Note: schema uses tenantId as the FK/PK for settings
        create: {
          tenantId: shopId,
          ...settingsUpdatePayload,
        },
        update: settingsUpdatePayload,
      }),
    ]);
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, code: "NOT_FOUND" };
    }
    throw error;
  }
};
