import type { Response } from "express";
import {
  createTenantDevice,
  deleteTenantDevice,
  getTenantDeviceById,
  getTenantDevices,
  updateTenantDevice,
} from "@/services/device/device.service";
import type { AuthRequest } from "@/types/auth.types";
import {
  createDeviceSchema,
  deviceListQuerySchema,
  updateDeviceSchema,
} from "@/validators/device/device.validator";

export const getDevices = async (req: AuthRequest, res: Response) => {
  const parsedQuery = deviceListQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsedQuery.error.issues,
    });
  }

  try {
    const devices = await getTenantDevices(
      req.user!.tenantId,
      parsedQuery.data,
    );
    return res.status(200).json({ success: true, data: devices });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Failed to fetch devices",
    });
  }
};

export const getDeviceById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const device = await getTenantDeviceById(id, req.user!.tenantId);
    return res.status(200).json({ success: true, data: device });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Failed to fetch device",
    });
  }
};

export const createDevice = async (req: AuthRequest, res: Response) => {
  const parsedBody = createDeviceSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsedBody.error.issues,
    });
  }

  try {
    const device = await createTenantDevice(
      req.user!.tenantId,
      parsedBody.data,
    );
    return res.status(201).json({ success: true, data: device });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Failed to create device",
    });
  }
};

export const updateDevice = async (req: AuthRequest, res: Response) => {
  const parsedBody = updateDeviceSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsedBody.error.issues,
    });
  }

  try {
    const id = req.params.id as string;
    const device = await updateTenantDevice(
      id,
      req.user!.tenantId,
      parsedBody.data,
    );
    return res.status(200).json({ success: true, data: device });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Failed to update device",
    });
  }
};

export const deleteDevice = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteTenantDevice(id, req.user!.tenantId);
    return res
      .status(200)
      .json({ success: true, message: "Device deleted successfully" });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Failed to delete device",
    });
  }
};
