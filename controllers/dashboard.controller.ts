import { getTodayRepairs } from "@/services/dashboard/dashboard.service";
import { logger } from "@/config/logger.config";
import { Request, Response } from "express";

// TODO: Replace mock auth with real JWT middleware 


// GET /api/v1/dashboard/today-repairs
export const todayRepairs = async (req: Request, res: Response) => {
  try {
    // TODO: Replace this with JWT decoded user once auth services is integrated
    // const auth = req.user
    const auth = {
      user_id: req.headers["x-user-id"] as string,
      role: req.headers["x-user-role"] as "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER",
      tenant_id: req.headers["x-tenant-id"] as string,
    };

    const validRoles = ["ADMIN", "MANAGER", "TECHNICIAN", "CUSTOMER"];

    if (!auth.user_id || !auth.role || !auth.tenant_id) {
        logger.warn(`[todayRepairs] -> Missing auth headers`);
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!validRoles.includes(auth.role)) {
        logger.warn(`[todayRepairs] -> Invalid role: ${auth.role}`);
        return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await getTodayRepairs(auth);
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error(`[todayRepairs] -> ${error.message}`);
    return res.status(error.status ?? 500).json({
      error: "Unable to fetch today's repair summary",
    });
  }
};