import { prisma } from "@/db/prisma";
import {
  createShopIds,
  shopRegister,
  sendEmailVerification,
  validateEmailToken,
} from "@/services/shop/shop.service";
import {
  generateShopIdsSchema,
  registerShopSchema,
  sendVerificationSchema,
  verifyEmailSchema,
} from "@/validators/shop/shop.validator";
import { logger } from "@/config/logger.config";
import { Request, Response } from "express";

// CRUD
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
    const { tenantId, name, address, phone } = req.body;
    if (!tenantId || !name)
      return res.status(400).json({ success: false, message: "tenantId and name are required" });
    const shop = await prisma.shop.create({ data: { tenantId, name, address, phone } });
    res.status(201).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create shop", error });
  }
};

export const updateShop = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, address, phone } = req.body;
    const shop = await prisma.shop.update({ where: { id }, data: { name, address, phone } });
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

// Onboarding
export const generateShopIds = async (req: Request, res: Response) => {
  const parsed = generateShopIdsSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[generateShopIds] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }
  try {
    const data = await createShopIds(parsed.data);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    logger.error(`[generateShopIds] -> ${error.message}`);
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

export const registerShop = async (req: Request, res: Response) => {
  const parsed = registerShopSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[registerShop] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }
  try {
    const data = await shopRegister(parsed.data);
    return res.status(200).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data,
    });
  } catch (error: any) {
    logger.error(`[registerShop] -> ${error.message}`);
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Failed transaction",
    });
  }
};

export const sendVerification = async (req: Request, res: Response) => {
  const parsed = sendVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[sendVerification] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }
  try {
    await sendEmailVerification(parsed.data.user_id, parsed.data.email);
    return res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (error: any) {
    logger.error(`[sendVerification] -> ${error.message}`);
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Email delivery failed",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const parsed = verifyEmailSchema.safeParse(req.query);
  if (!parsed.success) {
    logger.warn(`[verifyEmail] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }
  try {
    await validateEmailToken(parsed.data.token);
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    logger.error(`[verifyEmail] -> ${error.message}`);
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};