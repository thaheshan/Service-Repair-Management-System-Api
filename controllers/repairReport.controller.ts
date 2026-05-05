import { logger } from "@/config/logger.config";
import type { Request, Response } from "express";
import { getRepairReport } from "@/services/reports/repairReport.service";
import type { AuthRequest } from "@/types/auth.types";
import type { RepairReportPeriod } from "@/types/dto/repairReport.dto";

const PERIODS: RepairReportPeriod[] = ["daily", "weekly", "monthly", "yearly"];

function parsePeriod(raw: unknown): RepairReportPeriod {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!s) return "monthly";
  if (PERIODS.includes(s as RepairReportPeriod)) return s as RepairReportPeriod;
  throw Object.assign(new Error("period must be one of: daily, weekly, monthly, yearly"), { status: 400 });
}

// GET /api/v1/reports/repairs
export async function getRepairsReport(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const period = parsePeriod(req.query.period);
    const report = await getRepairReport(
      {
        tenantId: authReq.user.tenantId,
        shopId: authReq.user.shopId,
        role: authReq.user.role,
        userId: authReq.user.id,
      },
      period
    );

    return res.status(200).json(report);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 400) {
      return res.status(400).json({ error: err.message ?? "Invalid request" });
    }
    logger.error(`[getRepairsReport] ${err?.message ?? error}`);
    return res.status(500).json({ error: "Unable to generate repair report" });
  }
}
