import { getTodayRepairs } from "@/services/dashboard/dashboard.service";
import type { AuthRequest } from "@/types/auth.types";
import { logger } from "@/config/logger.config";
import { Request, Response } from "express";

// GET /api/v1/dashboard/today-repairs
export const todayRepairs = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      logger.warn(`[todayRepairs] -> Missing auth user`);
      return res.status(401).json({ error: "Unauthorized" });
    }

    const auth = {
      user_id: authReq.user.id,
      role: authReq.user.role,
      tenant_id: authReq.user.tenantId,
    };

    const data = await getTodayRepairs(auth);
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error(`[todayRepairs] -> ${error.message}`);
    return res.status(error.status ?? 500).json({
      error: "Unable to fetch today's repair summary",
    });
  }
};