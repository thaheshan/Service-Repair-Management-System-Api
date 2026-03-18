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

export const getShops = async (req: AuthRequest, res: Response) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { tenantId: req.user!.tenantId },
    });
    res.status(200).json({ success: true, data: shops });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch shops", error });
  }
};

export const getShopById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const shop = await prisma.shop.findFirst({ where: { id, tenantId: req.user!.tenantId } });
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch shop", error });
  }
};

export const createShop = async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, phone } = req.body;
    if (!name)
      return res.status(400).json({ success: false, message: "name is required" });
    const shop = await prisma.shop.create({ data: { tenantId: req.user!.tenantId, name, address, phone } });
    res.status(201).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create shop", error });
  }
};

export const updateShop = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, address, phone } = req.body;
    const shop = await prisma.shop.update({
      where: { id, tenantId: req.user!.tenantId },
      data: { name, address, phone },
    });
    res.status(200).json({ success: true, data: shop });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Shop not found" });
    res.status(500).json({ success: false, message: "Failed to update shop", error });
  }
};

export const deleteShop = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.shop.delete({ where: { id, tenantId: req.user!.tenantId } });
    res.status(200).json({ success: true, message: "Shop deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Shop not found" });
    res.status(500).json({ success: false, message: "Failed to delete shop", error });
  }
};