import { logger } from "@/config/logger.config";
import type { AuthRequest } from "@/types/auth.types";
import {
  createStaffMember,
  deactivateStaffMember,
  getStaffDashboardContextService,
  listStaffMembers,
  registerStaffService,
  updateStaffMember,
  validateShopIdService,
} from "@/services/staff/staff.service";
import {
  createStaffSchema,
  registerStaffSchema,
  updateStaffSchema,
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

export const getStaffDashboardContext = async (req: AuthRequest, res: Response) => {
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

export const getStaffList = async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.query.includeInactive;
    const includeInactive =
      typeof raw === "string"
        ? raw.toLowerCase() === "true"
        : Array.isArray(raw) && typeof raw[0] === "string"
          ? raw[0].toLowerCase() === "true"
          : false;
    const staff = await listStaffMembers(
      req.user!.tenantId,
      req.user!.shopId ?? null,
      includeInactive,
    );
    return res.status(200).json({ staff });
  } catch (error: any) {
    logger.error(`[getStaffList] -> ${error?.message ?? error}`);
    return res.status(500).json({ error: "Unable to fetch staff list" });
  }
};

export const addStaff = async (req: AuthRequest, res: Response) => {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[addStaff] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }

  const shopId = req.user?.shopId;
  if (!shopId) {
    return res.status(400).json({ error: "Unable to add staff member" });
  }

  try {
    const { staffDisplayId } = await createStaffMember(req.user!.tenantId, shopId, parsed.data);
    return res.status(201).json({
      message: "Staff member added successfully",
      staffId: staffDisplayId,
    });
  } catch (error: any) {
    logger.error(`[addStaff] -> ${error?.message ?? error}`);
    const status = typeof error?.status === "number" ? error.status : 500;
    const safeStatus = status >= 400 && status < 600 ? status : 500;

    if (error?.code === "DUPLICATE" && safeStatus === 409) {
      const target: string[] = Array.isArray(error.target) ? error.target : [];
      if (target.includes("email")) {
        return res.status(409).json({
          error: "A staff member with this email already exists",
          code: "DUPLICATE_EMAIL",
        });
      }
      if (target.includes("staffDisplayId") || target.includes("tenantId")) {
        return res.status(409).json({
          error: "Staff identifier conflict; please try again",
          code: "DUPLICATE_STAFF_ID",
        });
      }
      return res.status(409).json({
        error: "Duplicate record; this value is already in use",
        code: "DUPLICATE",
        fields: target,
      });
    }

    return res.status(safeStatus).json({
      error: "Unable to add staff member",
    });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response) => {
  const shopId = req.user?.shopId;
  if (!shopId) {
    return res.status(400).json({ error: "Unable to update staff member" });
  }

  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[updateStaff] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }

  const staffId = req.params.staffId as string;
  try {
    await updateStaffMember(req.user!.tenantId, shopId, staffId, req.user!.id, parsed.data);
    return res.status(200).json({ message: "Staff member updated successfully" });
  } catch (error: any) {
    logger.error(`[updateStaff] -> ${error?.message ?? error}`);
    if (error?.code === "NOT_FOUND") {
      return res.status(404).json({ error: "Staff member not found" });
    }
    if (error?.code === "SELF_ACTION") {
      return res.status(400).json({ error: "Unable to update staff member" });
    }
    if (error?.code === "DUPLICATE" && error?.status === 409) {
      const target: string[] = Array.isArray(error.target) ? error.target : [];
      if (target.includes("email")) {
        return res.status(409).json({
          error: "A staff member with this email already exists",
          code: "DUPLICATE_EMAIL",
        });
      }
      return res.status(409).json({
        error: "Unable to update staff member",
        code: "DUPLICATE",
        fields: target,
      });
    }
    const status = typeof error?.status === "number" ? error.status : 500;
    const safeStatus = status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({ error: "Unable to update staff member" });
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response) => {
  const shopId = req.user?.shopId;
  if (!shopId) {
    return res.status(400).json({ error: "Unable to delete staff member" });
  }

  const staffId = req.params.staffId as string;
  try {
    await deactivateStaffMember(req.user!.tenantId, shopId, staffId, req.user!.id);
    return res.status(200).json({ message: "Staff member removed successfully" });
  } catch (error: any) {
    logger.error(`[deleteStaff] -> ${error?.message ?? error}`);
    if (error?.code === "NOT_FOUND") {
      return res.status(404).json({ error: "Staff member not found" });
    }
    if (error?.code === "SELF_ACTION") {
      return res.status(400).json({ error: "Unable to delete staff member" });
    }
    const status = typeof error?.status === "number" ? error.status : 500;
    const safeStatus = status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({ error: "Unable to delete staff member" });
  }
};