import {
  generateShopIdsService,
  registerShopService,
  sendVerificationService,
} from "@/services/shop/shop.onboarding.service";
import {
  generateShopIdsSchema,
  registerShopSchema,
  sendVerificationSchema,
} from "@/validators/shop/shop.validator";
import { logger } from "@/config/logger.config";
import { Request, Response } from "express";

// BE-REG-01: POST /api/shop/generate-ids
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
    const data = await generateShopIdsService(parsed.data);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    logger.error(`[generateShopIds] -> ${error.message}`);
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

// BE-REG-02: POST /api/shop/register
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
    const data = await registerShopService(parsed.data);
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

// BE-REG-03: POST /api/user/send-verification
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
    await sendVerificationService(parsed.data.user_id, parsed.data.email);
    return res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (error: any) {
    logger.error(`[sendVerification] -> ${error.message}`);
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Email delivery failed",
    });
  }
};
import { verifyEmailService } from "@/services/shop/shop.onboarding.service";
import { verifyEmailSchema } from "@/validators/shop/shop.validator";

// BE-REG-04: GET /api/user/verify-email?token=xxx
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
    await verifyEmailService(parsed.data.token);
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