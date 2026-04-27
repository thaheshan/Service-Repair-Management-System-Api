import {
  createTenantShop,
  deleteTenantShop,
  createShopIds,
  getTenantShopById,
  getTenantShops,
  shopRegister,
  sendEmailVerification,
  updateTenantShop,
  validateEmailToken,
} from "@/services/shop/shop.service";
import {
  generateShopIdsSchema,
  registerShopSchema,
  sendVerificationSchema,
  verifyEmailSchema,
} from "@/validators/shop/shop.validator";
import { logger } from "@/config/logger.config";
import type { Request, Response } from "express";
import type { AuthRequest } from "@/types/auth.types";

export const getShops = async (req: AuthRequest, res: Response) => {
  try {
    const shops = await getTenantShops(req.user!.tenantId);
    res.status(200).json({ success: true, data: shops });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to fetch shops" });
  }
};

export const getShopById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const shop = await getTenantShopById(id, req.user!.tenantId);
    res.status(200).json({ success: true, data: shop });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to fetch shop" });
  }
};

export const createShop = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Missing access token" });
    }
    const {
      shopCode,
      name,
      address,
      phone,
      isActive = true,
      acceptsStaffRegistrations = true,
    } = req.body;
    if (!name || !shopCode)
      return res.status(400).json({ success: false, message: "shopCode and name are required" });
    const shop = await createTenantShop(tenantId, {
      shopCode,
      name,
      address,
      phone,
      isActive,
      acceptsStaffRegistrations,
    });
    res.status(201).json({ success: true, data: shop });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to create shop" });
  }
};

export const updateShop = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Missing access token" });
    }
    const { shopCode, name, address, phone, isActive, acceptsStaffRegistrations } = req.body;
    const shop = await updateTenantShop(id, tenantId, {
      shopCode,
      name,
      address,
      phone,
      isActive,
      acceptsStaffRegistrations,
    });
    res.status(200).json({ success: true, data: shop });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to update shop" });
  }
};

export const deleteShop = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteTenantShop(id, req.user!.tenantId);
    res.status(200).json({ success: true, message: "Shop deleted successfully" });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to delete shop" });
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
    
    // Redirect to frontend login with a success flag
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (error: any) {
    logger.error(`[verifyEmail] -> ${error.message}`);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || "Verification failed")}`);
  }
};