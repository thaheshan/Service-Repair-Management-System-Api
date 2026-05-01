import { Request, Response } from "express";
import * as adminService from "@/services/admin/admin.service";
import { logger } from "@/config/logger.config";

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getSuperAdminStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    logger.error(`[AdminController.getStats] -> ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch admin stats" });
  }
};

export const listShops = async (req: Request, res: Response) => {
  try {
    const shops = await adminService.getAllShops();
    return res.status(200).json({ success: true, data: shops });
  } catch (error: any) {
    logger.error(`[AdminController.listShops] -> ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch shops" });
  }
};
