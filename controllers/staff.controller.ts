import { logger } from "@/config/logger.config";
import { createStaffMember, listStaffMembers } from "@/services/staff/staff.service";
import type { AuthRequest } from "@/types/auth.types";
import { createStaffSchema } from "@/validators/staff/staff.validator";
import type { Response } from "express";

export const getStaffList = async (req: AuthRequest, res: Response) => {
  try {
    const staff = await listStaffMembers(req.user!.tenantId, req.user!.shopId ?? null);
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
