import { prisma } from "@/db/prisma";
import type {
  RepairReportItem,
  RepairReportPeriod,
  RepairReportResponse,
  RepairReportScope,
} from "@/types/dto/repairReport.dto";

/** Mirrors `RepairStatus` in prisma/schema.prisma */
type RepairStatusValue = "NOT_STARTED" | "IN_PROGRESS" | "READY_TO_TAKE" | "DELIVERED";

const DEFAULT_PRIORITY_LABEL = "Medium";
const DEFAULT_DUE_LABEL = "Standard";

export function repairStatusDisplay(status: RepairStatusValue): string {
  switch (status) {
    case "NOT_STARTED":
      return "Pending";
    case "IN_PROGRESS":
      return "In Progress";
    case "READY_TO_TAKE":
      return "Ready";
    case "DELIVERED":
      return "Completed";
    default:
      return status;
  }
}

function formatDeviceLabel(brand: string, model: string): string {
  const b = brand?.trim() ?? "";
  const m = model?.trim() ?? "";
  if (!b && !m) return "Unknown Device";
  return `${b} ${m}`.trim();
}

function mapRepairRow(r: {
  reference: string;
  status: RepairStatusValue;
  issue: string | null;
  estimatedCost: number | null;
  finalCost: number | null;
  customer: { name: string; phone: string | null };
  device: { brand: string; model: string };
  technician: { fullName: string; name: string | null } | null;
}): RepairReportItem {
  const tech = r.technician;
  const technicianName =
    tech?.fullName?.trim() || tech?.name?.trim() || "Unassigned";

  return {
    reference: r.reference,
    customer: r.customer.name,
    phone: r.customer.phone,
    device: formatDeviceLabel(r.device.brand, r.device.model),
    issue: r.issue?.trim() ?? "",
    status: repairStatusDisplay(r.status),
    priority: DEFAULT_PRIORITY_LABEL,
    technician: technicianName,
    amount: r.finalCost ?? r.estimatedCost ?? null,
    dueDate: DEFAULT_DUE_LABEL,
  };
}

/** Local calendar boundaries for reporting (aligned with dashboard date handling). */
export function getPeriodDateRange(period: RepairReportPeriod, now = new Date()): { start: Date; end: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "daily": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "weekly": {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(d);
      start.setDate(d.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "monthly": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "yearly": {
      const start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  }
}

function baseWhere(scope: RepairReportScope, start: Date, end: Date) {
  return {
    tenantId: scope.tenantId,
    ...(scope.shopId ? { shopId: scope.shopId } : {}),
    ...(scope.role === "TECHNICIAN" ? { technicianId: scope.userId } : {}),
    createdAt: { gte: start, lte: end },
  };
}

export async function getRepairReport(
  scope: RepairReportScope,
  period: RepairReportPeriod
): Promise<RepairReportResponse> {
  const { start, end } = getPeriodDateRange(period);
  const where = baseWhere(scope, start, end);

  const rows = await prisma.repair.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      device: { select: { brand: true, model: true } },
      technician: { select: { fullName: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRepairs = rows.length;
  const completedRepairs = rows.filter((r) => r.status === "DELIVERED").length;
  const pendingRepairs = totalRepairs - completedRepairs;
  const repairs = rows.map(mapRepairRow);

  return {
    totalRepairs,
    completedRepairs,
    pendingRepairs,
    generatedAt: new Date().toISOString(),
    repairs,
  };
}
