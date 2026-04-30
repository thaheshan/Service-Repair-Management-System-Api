export interface CreateInventoryItemRequest {
  partName: string;
  partNumber?: string;
  category?: string;
  compatibleBrands?: string[];
  compatibleModels?: string[];
  supplierName?: string;
  quantityInStock: number;
  minimumStockLevel: number;
  unitCost: number;
  sellingPrice: number;
}

export interface UpdateInventoryItemRequest {
  partName?: string;
  partNumber?: string;
  category?: string;
  compatibleBrands?: string[];
  compatibleModels?: string[];
  supplierName?: string;
  quantityInStock?: number;
  minimumStockLevel?: number;
  unitCost?: number;
  sellingPrice?: number;
}

export interface InventoryItemResponse {
  id: string;
  partName: string;
  partNumber: string | null;
  category: string | null;
  quantityInStock: number;
  minimumStockLevel: number;
  unitCost: number;
  sellingPrice: number;
  supplierName: string | null;
}

export interface LowStockItem {
  id: string;
  partName: string;
  quantityInStock: number;
  minimumStockLevel: number;
}

export interface InventoryUsageItem {
  partId: string;
  partName: string;
  totalQuantityUsed: number;
  totalRepairs: number;
}