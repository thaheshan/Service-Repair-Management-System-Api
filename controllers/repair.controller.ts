import type { Response } from "express";
import {
  createTenantRepair,
  deleteTenantRepair,
  getTenantRepairById,
  getTenantRepairs,
  updateTenantRepair,
  addRepairNote,
} from "@/services/repair/repair.service";
import type { AuthRequest } from "@/types/auth.types";

export const addNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Note text is required" });
    
    const note = await addRepairNote(id as string, req.user!.id, text);
    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to add note" });
  }
};

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
    console.error("====== GET REPAIR FATAL ERROR ======");
    console.error(error);
    console.error("====================================");
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to fetch repair" });
  }
};

export const createRepair = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, customerId, deviceId, issue, internalNotes, priority, estimatedCompletionDate, estimatedCost, technicianId } = req.body;
    if (!shopId || !customerId || !deviceId)
      return res.status(400).json({ success: false, message: "shopId, customerId and deviceId are required" });
    const repair = await createTenantRepair(req.user!.tenantId, {
      shopId,
      customerId,
      deviceId,
      issue,
      internalNotes,
      priority,
      estimatedCompletionDate: estimatedCompletionDate ? new Date(estimatedCompletionDate) : undefined,
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
    const { status, issue, diagnosis, estimatedCost, finalCost, technicianId } = req.body;
    
    // Only pass fields that are guaranteed to exist in the current database.
    // NOTE: priority and estimatedCompletionDate require running `npx prisma db push` first.
    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (issue !== undefined) updateData.issue = issue;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (finalCost !== undefined) updateData.finalCost = finalCost;
    if (technicianId !== undefined) updateData.technicianId = technicianId;

    const repair = await updateTenantRepair(id, req.user!.tenantId, updateData);
    res.status(200).json({ success: true, data: repair });
  } catch (error: any) {
    console.error("====== PATCH REPAIR FATAL ERROR ======");
    console.error(error);
    console.error("======================================");
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