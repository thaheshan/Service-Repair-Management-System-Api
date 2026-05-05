import type { RepairReportPeriod } from "@/types/dto/repairReport.dto";

export const REPORT_PERIODS: RepairReportPeriod[] = ["daily", "weekly", "monthly", "yearly"];

export function parseReportPeriod(raw: unknown): RepairReportPeriod {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!s) return "monthly";
  if (REPORT_PERIODS.includes(s as RepairReportPeriod)) return s as RepairReportPeriod;
  throw Object.assign(new Error("period must be one of: daily, weekly, monthly, yearly"), { status: 400 });
}
