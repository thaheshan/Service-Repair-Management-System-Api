import { z } from "zod";

export const createInventoryItemSchema = z.object({
  partName: z.string().min(1, "Part name is required"),
  partNumber: z.string().optional(),
  category: z.string().optional(),
  compatibleBrands: z.array(z.string()).optional(),
  compatibleModels: z.array(z.string()).optional(),
  supplierName: z.string().optional(),
  quantityInStock: z.number().int().min(0, "Quantity must be >= 0"),
  minimumStockLevel: z.number().int().min(0, "Minimum stock level must be >= 0"),
  unitCost: z.number().min(0, "Unit cost must be >= 0"),
  sellingPrice: z.number().min(0, "Selling price must be >= 0"),
});

export const updateInventoryItemSchema = z.object({
  partName: z.string().min(1).optional(),
  partNumber: z.string().optional(),
  category: z.string().optional(),
  compatibleBrands: z.array(z.string()).optional(),
  compatibleModels: z.array(z.string()).optional(),
  supplierName: z.string().optional(),
  quantityInStock: z.number().int().min(0).optional(),
  minimumStockLevel: z.number().int().min(0).optional(),
  unitCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
});