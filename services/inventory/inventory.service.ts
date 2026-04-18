import { prisma } from "@/db/prisma";
import { CreateInventoryItemRequest, UpdateInventoryItemRequest } from "@/types/dto/inventory.dto";
import { logger } from "@/config/logger.config";

export const createInventoryItem = async (
  data: CreateInventoryItemRequest,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[createInventoryItem] -> Creating inventory item: ${data.partName}`);

  const item = await prisma.partsInventory.create({
    data: {
      tenantId,
      shopId,
      partName: data.partName,
      partNumber: data.partNumber ?? null,
      category: data.category ?? null,
      compatibleBrands: data.compatibleBrands ?? [],
      compatibleModels: data.compatibleModels ?? [],
      supplierName: data.supplierName ?? null,
      quantityInStock: data.quantityInStock,
      minimumStockLevel: data.minimumStockLevel,
      unitCost: data.unitCost,
      sellingPrice: data.sellingPrice,
    },
  });

  logger.info(`[createInventoryItem] -> Item created: ${item.id}`);
  return item;
};

export const getInventoryItems = async (tenantId: string, shopId: string) => {
  logger.info(`[getInventoryItems] -> Fetching all items for shop: ${shopId}`);

  const items = await prisma.partsInventory.findMany({
    where: { tenantId, shopId, isActive: true },
    select: {
      id: true,
      partName: true,
      partNumber: true,
      category: true,
      quantityInStock: true,
      minimumStockLevel: true,
      unitCost: true,
      sellingPrice: true,
      supplierName: true,
    },
    orderBy: { createdAt: "desc" },
  });

  logger.info(`[getInventoryItems] -> Found ${items.length} items`);
  return items;
};

export const getInventoryItemById = async (
  itemId: string,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[getInventoryItemById] -> Fetching item: ${itemId}`);

  const item = await prisma.partsInventory.findFirst({
    where: { id: itemId, tenantId, shopId, isActive: true },
  });

  if (!item) {
    logger.warn(`[getInventoryItemById] -> Item not found: ${itemId}`);
    throw { status: 404, message: "Item not found" };
  }

  logger.info(`[getInventoryItemById] -> Item found: ${itemId}`);
  return item;
};

export const updateInventoryItem = async (
  itemId: string,
  data: UpdateInventoryItemRequest,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[updateInventoryItem] -> Updating item: ${itemId}`);

  const existing = await prisma.partsInventory.findFirst({
    where: { id: itemId, tenantId, shopId, isActive: true },
  });

  if (!existing) {
    logger.warn(`[updateInventoryItem] -> Item not found: ${itemId}`);
    throw { status: 404, message: "Item not found" };
  }

  const item = await prisma.partsInventory.update({
    where: { id: itemId },
    data: {
      ...(data.partName !== undefined && { partName: data.partName }),
      ...(data.partNumber !== undefined && { partNumber: data.partNumber }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.compatibleBrands !== undefined && { compatibleBrands: data.compatibleBrands }),
      ...(data.compatibleModels !== undefined && { compatibleModels: data.compatibleModels }),
      ...(data.supplierName !== undefined && { supplierName: data.supplierName }),
      ...(data.quantityInStock !== undefined && { quantityInStock: data.quantityInStock }),
      ...(data.minimumStockLevel !== undefined && { minimumStockLevel: data.minimumStockLevel }),
      ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
      ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
    },
  });

  logger.info(`[updateInventoryItem] -> Item updated: ${itemId}`);
  return item;
};

export const deleteInventoryItem = async (
  itemId: string,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[deleteInventoryItem] -> Deleting item: ${itemId}`);

  const existing = await prisma.partsInventory.findFirst({
    where: { id: itemId, tenantId, shopId },
  });

  if (!existing) {
    logger.warn(`[deleteInventoryItem] -> Item not found: ${itemId}`);
    throw { status: 404, message: "Item not found" };
  }

  await prisma.partsInventory.update({
    where: { id: itemId },
    data: { isActive: false },
  });

  logger.info(`[deleteInventoryItem] -> Item soft deleted: ${itemId}`);
};

export const getLowStockItems = async (tenantId: string, shopId: string) => {
  logger.info(`[getLowStockItems] -> Fetching low stock items for shop: ${shopId}`);

  const items = await prisma.partsInventory.findMany({
    where: {
      tenantId,
      shopId,
      isActive: true,
    },
    select: {
      id: true,
      partName: true,
      quantityInStock: true,
      minimumStockLevel: true,
    },
  });

  const lowStockItems = items.filter(
    (item) => item.quantityInStock <= item.minimumStockLevel
  );

  logger.info(`[getLowStockItems] -> Found ${lowStockItems.length} low stock items`);
  return lowStockItems;
};

export const getInventoryUsage = async (tenantId: string, shopId: string) => {
  logger.info(`[getInventoryUsage] -> Fetching usage report for shop: ${shopId}`);

  const usageData = await prisma.repairPartsUsed.groupBy({
    by: ["partId"],
    where: {
      repair: {
        tenantId,
        shopId,
      },
    },
    _sum: {
      quantityUsed: true,
    },
    _count: {
      repairId: true,
    },
  });

  const usageReport = await Promise.all(
    usageData.map(async (item) => {
      const part = await prisma.partsInventory.findUnique({
        where: { id: item.partId },
        select: { partName: true },
      });

      return {
        partId: item.partId,
        partName: part?.partName ?? "Unknown Part",
        totalQuantityUsed: item._sum.quantityUsed ?? 0,
        totalRepairs: item._count.repairId,
      };
    })
  );

  logger.info(`[getInventoryUsage] -> Usage report generated with ${usageReport.length} items`);
  return usageReport;
};