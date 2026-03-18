import { prisma } from "@/db/prisma";
import type { Request, Response } from "express";

type AuthUser = {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";
  tenantId: string;
  shopId: string | null;
};

type AuthRequest = Request & { user?: AuthUser };

export const getRepairs = async (req: AuthRequest, res: Response) => {
  try {
    const repairs = await prisma.repair.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { customer: true, device: true, technician: { select: { id: true, email: true, role: true } } },
    });
    res.status(200).json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch repairs", error });
  }
};

export const getRepairById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const repair = await prisma.repair.findUnique({
      where: { id, tenantId: req.user!.tenantId },
      include: { customer: true, device: true, technician: { select: { id: true, email: true, role: true } }, photos: true },
    });
    if (!repair) return res.status(404).json({ success: false, message: "Repair not found" });
    res.status(200).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch repair", error });
  }
};

export const createRepair = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, customerId, deviceId, issue, estimatedCost, technicianId } = req.body;
    if (!shopId || !customerId || !deviceId)
      return res.status(400).json({ success: false, message: "shopId, customerId and deviceId are required" });
    const repair = await prisma.repair.create({
      data: { tenantId: req.user!.tenantId, shopId, customerId, deviceId, issue, estimatedCost, technicianId },
    });
    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create repair", error });
  }
};

export const updateRepair = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, diagnosis, estimatedCost, finalCost, technicianId } = req.body;
    const repair = await prisma.repair.update({
      where: { id, tenantId: req.user!.tenantId },
      data: { status, diagnosis, estimatedCost, finalCost, technicianId },
    });
    res.status(200).json({ success: true, data: repair });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Repair not found" });
    res.status(500).json({ success: false, message: "Failed to update repair", error });
  }
};

export const deleteRepair = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.repair.delete({ where: { id, tenantId: req.user!.tenantId } });
    res.status(200).json({ success: true, message: "Repair deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Repair not found" });
    res.status(500).json({ success: false, message: "Failed to delete repair", error });
  }
};