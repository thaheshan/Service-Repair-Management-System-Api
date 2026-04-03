import type { Request, Response } from "express";
import {
  createTenantRepair,
  deleteTenantRepair,
  getTenantRepairById,
  getTenantRepairs,
  updateTenantRepair,
} from "@/services/repair/repair.service";
import type { AuthRequest } from "@/types/auth.types";

export const getRepairs = async (req: AuthRequest, res: Response) => {
  try {
    const repairs = await getTenantRepairs(req.user!.tenantId);
    res.status(200).json({ success: true, data: repairs });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to fetch repairs" });
  }
};

export const getRepairById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const repair = await getTenantRepairById(id, req.user!.tenantId);
    res.status(200).json({ success: true, data: repair });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to fetch repair" });
  }
};

export const createRepair = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, customerId, deviceId, issue, estimatedCost, technicianId } = req.body;
    if (!shopId || !customerId || !deviceId)
      return res.status(400).json({ success: false, message: "shopId, customerId and deviceId are required" });
    const repair = await createTenantRepair(req.user!.tenantId, {
      shopId,
      customerId,
      deviceId,
      issue,
      estimatedCost,
      technicianId,
    });
    res.status(201).json({ success: true, data: repair });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to create repair" });
  }
};

export const updateRepair = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, diagnosis, estimatedCost, finalCost, technicianId } = req.body;
    const repair = await updateTenantRepair(id, req.user!.tenantId, {
      status,
      diagnosis,
      estimatedCost,
      finalCost,
      technicianId,
    });
    res.status(200).json({ success: true, data: repair });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to update repair" });
  }
};

export const deleteRepair = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteTenantRepair(id, req.user!.tenantId);
    res.status(200).json({ success: true, message: "Repair deleted successfully" });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to delete repair" });
  }
};