import { prisma } from "@/db/prisma";
import { logger } from "@/config/logger.config";
import type { DashboardAuthContext, TodayRepairsResponse } from "@/types/dto/dashboard.dto";
import type { AuthRole } from "@/types/auth.types";

export const getTodayRepairs = async (
  auth: DashboardAuthContext
): Promise<TodayRepairsResponse> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = today.toISOString().split("T")[0];

  logger.info(`[getTodayRepairs] -> Fetching today's repairs for role: ${auth.role}`);

  if (auth.role === "TECHNICIAN") {
    logger.info(`[getTodayRepairs] -> Scoping to technician: ${auth.user_id}`);
    const count = await prisma.repair.count({
      where: {
        tenantId: auth.tenant_id,
        ...(auth.shop_id ? { shopId: auth.shop_id } : {}),
        technicianId: auth.user_id,
        createdAt: { gte: today, lt: tomorrow },
      },
    });
    logger.info(`[getTodayRepairs] -> Technician repairs today: ${count}`);
    return { todayRepairs: count, date };
  }

  const count = await prisma.repair.count({
    where: {
      tenantId: auth.tenant_id,
      ...(auth.shop_id ? { shopId: auth.shop_id } : {}),
      createdAt: { gte: today, lt: tomorrow },
    },
  });
  logger.info(`[getTodayRepairs] -> Total repairs today: ${count}`);
  return { todayRepairs: count, date };
};

export async function countPendingRepairs(params: {
  tenantId: string;
  shopId: string | null;
  role: AuthRole;
  userId: string;
}) {
  const { tenantId, shopId, role, userId } = params;
  return prisma.repair.count({
    where: {
      tenantId,
      ...(shopId ? { shopId } : {}),
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      ...(role === "TECHNICIAN" ? { technicianId: userId } : {}),
    },
  });
}