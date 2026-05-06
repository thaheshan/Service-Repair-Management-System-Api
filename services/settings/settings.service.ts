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
) => {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, tenantId },
    include: { settings: true },
  });

  if (!shop) {
    throw { status: 404, code: "NOT_FOUND" };
  }

  return {
    shop: {
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      website: shop.website,
      taxNumber: shop.taxNumber,
    },
    settings: {
      currency: shop.settings?.currency ?? "LKR",
      timezone: shop.settings?.timezone ?? "(GMT +05:30) Colombo, Sri Lanka",
      taxPercentage: Number(shop.settings?.taxRate ?? 0),
      notificationPreferences: shop.settings?.notificationPreferences ?? {},
    },
  };
};

export const updateShopSettings = async (
  tenantId: string,
  shopId: string,
  data: UpdateSettingsInput,
): Promise<void> => {
  const shopUpdatePayload: Prisma.ShopUpdateInput = {};
  const settingsUpdatePayload: any = {};

  // Shop Profile Fields
  if (data.shopName !== undefined) shopUpdatePayload.name = data.shopName;
  if (data.address !== undefined) shopUpdatePayload.address = data.address;
  if (data.phone !== undefined) shopUpdatePayload.phone = data.phone;
  if (data.email !== undefined) shopUpdatePayload.email = data.email;
  if (data.website !== undefined) shopUpdatePayload.website = data.website;
  if (data.taxNumber !== undefined) shopUpdatePayload.taxNumber = data.taxNumber;

  // Settings Fields
  if (data.currency !== undefined) settingsUpdatePayload.currency = data.currency.trim().toUpperCase();
  if (data.timezone !== undefined) settingsUpdatePayload.timezone = data.timezone;
  if (data.taxPercentage !== undefined) settingsUpdatePayload.taxRate = data.taxPercentage;
  if (data.notificationPreferences !== undefined) {
    settingsUpdatePayload.notificationPreferences = data.notificationPreferences;
  }
  if (data.notificationsEnabled !== undefined) {
    // If just toggling enabled, merge with existing if possible or set a flag
    settingsUpdatePayload.notificationPreferences = { 
      ...(settingsUpdatePayload.notificationPreferences || {}),
      enabled: data.notificationsEnabled 
    };
  }

  const existing = await prisma.shop.findFirst({
    where: { id: shopId, tenantId },
    select: { id: true },
  });
  if (!existing) {
    throw { status: 404, code: "NOT_FOUND" };
  }

  try {
    const transactions: any[] = [];
    
    if (Object.keys(shopUpdatePayload).length > 0) {
      transactions.push(prisma.shop.update({
        where: { id: shopId },
        data: shopUpdatePayload,
      }));
    }

    if (Object.keys(settingsUpdatePayload).length > 0) {
      transactions.push(prisma.shopSettings.upsert({
        where: { tenantId: shopId },
        create: {
          tenantId: shopId,
          ...settingsUpdatePayload,
        },
        update: settingsUpdatePayload,
      }));
    }

    if (transactions.length > 0) {
      await prisma.$transaction(transactions);
    }
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, code: "NOT_FOUND" };
    }
    throw error;
  }
};
