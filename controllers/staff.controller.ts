import type { AuthRequest } from "@/types/auth.types";
import {
  getStaffDashboardContextService,
  registerStaffService,
  validateShopIdService,
} from "@/services/staff/staff.service";
import {
  registerStaffSchema,
  validateShopIdSchema,
} from "@/validators/staff/staff.validator";
import { Request, Response } from "express";

export const validateShopId = async (req: Request, res: Response) => {
  const parsed = validateShopIdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      errors: parsed.error.issues,
    });
  }

  try {
    const result = await validateShopIdService(parsed.data, {
      request_source: req.header("x-request-source"),
      request_signature: req.header("x-request-signature"),
      request_timestamp: req.header("x-request-timestamp"),
    });

    return res.status(200).json({
      success: true,
      message: "Shop valid",
      data: result,
    });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({
      success: false,
      message: error.message ?? "Validation failure",
    });
  }
};

export const registerStaff = async (req: Request, res: Response) => {
  const parsed = registerStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      errors: parsed.error.issues,
    });
  }

  try {
    const result = await registerStaffService(parsed.data, {
      request_source: req.header("x-request-source"),
      request_signature: req.header("x-request-signature"),
      request_timestamp: req.header("x-request-timestamp"),
    });

    return res.status(200).json({
      success: true,
      message: "Staff registered successfully",
      data: {
        staff: result.staff,
        access_token: result.access_token,
      },
    });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

export const getStaffDashboardContext = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Missing access token" });
    }

    const user = await getStaffDashboardContextService(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff account not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, message: "Unexpected failure" });
  }
};
