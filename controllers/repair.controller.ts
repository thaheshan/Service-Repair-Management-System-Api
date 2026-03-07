import { prisma } from "@/db/prisma";
import { Request, Response } from "express";

export const getRepairs = async (req: Request, res: Response) => {
  try {
    const repairs = await prisma.repair.findMany({
      include: { customer: true, device: true, technician: { select: { id: true, email: true, role: true } } },
    });
    res.status(200).json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch repairs", error });
  }
};

export const getRepairById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const repair = await prisma.repair.findUnique({
      where: { id },
      include: { customer: true, device: true, technician: { select: { id: true, email: true, role: true } }, photos: true },
    });
    if (!repair) return res.status(404).json({ success: false, message: "Repair not found" });
    res.status(200).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch repair", error });
  }
};

export const createRepair = async (req: Request, res: Response) => {
  try {
    const { tenantId, shopId, customerId, deviceId, issue, estimatedCost, technicianId } = req.body;
    if (!tenantId || !shopId || !customerId || !deviceId)
      return res.status(400).json({ success: false, message: "tenantId, shopId, customerId and deviceId are required" });
    const repair = await prisma.repair.create({
      data: { tenantId, shopId, customerId, deviceId, issue, estimatedCost, technicianId },
    });
    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create repair", error });
  }
};

export const updateRepair = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, diagnosis, estimatedCost, finalCost, technicianId } = req.body;
    const repair = await prisma.repair.update({
      where: { id },
      data: { status, diagnosis, estimatedCost, finalCost, technicianId },
    });
    res.status(200).json({ success: true, data: repair });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Repair not found" });
    res.status(500).json({ success: false, message: "Failed to update repair", error });
  }
};

export const deleteRepair = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.repair.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Repair deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Repair not found" });
    res.status(500).json({ success: false, message: "Failed to delete repair", error });
  }
};