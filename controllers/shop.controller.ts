import { prisma } from "@/db/prisma";
import { Request, Response } from "express";

export const getShops = async (req: Request, res: Response) => {
  try {
    const shops = await prisma.shop.findMany();
    res.status(200).json({ success: true, data: shops });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch shops", error });
  }
};

export const getShopById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch shop", error });
  }
};

export const createShop = async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      shopCode,
      name,
      address,
      phone,
      isActive = true,
      acceptsStaffRegistrations = true,
    } = req.body;
    if (!tenantId || !name || !shopCode)
      return res.status(400).json({ success: false, message: "tenantId, shopCode and name are required" });
    const shop = await prisma.shop.create({
      data: { tenantId, shopCode, name, address, phone, isActive, acceptsStaffRegistrations },
    });
    res.status(201).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create shop", error });
  }
};

export const updateShop = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { shopCode, name, address, phone, isActive, acceptsStaffRegistrations } = req.body;
    const shop = await prisma.shop.update({
      where: { id },
      data: { shopCode, name, address, phone, isActive, acceptsStaffRegistrations },
    });
    res.status(200).json({ success: true, data: shop });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Shop not found" });
    res.status(500).json({ success: false, message: "Failed to update shop", error });
  }
};

export const deleteShop = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.shop.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Shop deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Shop not found" });
    res.status(500).json({ success: false, message: "Failed to delete shop", error });
  }
};