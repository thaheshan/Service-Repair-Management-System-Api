import { prisma } from "@/db/prisma";
import type { AuthRole } from "@/types/auth.types";
import { TodayRepairsResponse } from "@/types/dto/dashboard.dto";
import { logger } from "@/config/logger.config";

interface DashboardAuthContext {
  user_id: string;
  role: AuthRole;
  tenant_id: string;
}

export const getTodayRepairs = async (
  auth: DashboardAuthContext
): Promise<TodayRepairsResponse> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const date = today.toISOString().split("T")[0];

  logger.info(`[getTodayRepairs] -> Fetching today's repairs for role: ${auth.role}`);

  if (auth.role === "CUSTOMER") {
    logger.warn(`[getTodayRepairs] -> Access denied for role: CUSTOMER`);
    throw { status: 403, message: "Access denied" };
  }

  if (auth.role === "TECHNICIAN") {
    logger.info(`[getTodayRepairs] -> Scoping to technician: ${auth.user_id}`);
    const count = await prisma.repair.count({
      where: {
        technicianId: auth.user_id,
        tenantId: auth.tenant_id,
        createdAt: { gte: today, lt: tomorrow },
      },
    });
    logger.info(`[getTodayRepairs] -> Technician repairs today: ${count}`);
    return { todayRepairs: count, date };
  }

  const count = await prisma.repair.count({
    where: {
      tenantId: auth.tenant_id,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  logger.info(`[getTodayRepairs] -> Total repairs today: ${count}`);
  return { todayRepairs: count, date };
};