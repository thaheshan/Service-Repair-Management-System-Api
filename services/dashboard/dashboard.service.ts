import { prisma } from "@/db/prisma";
import type { AuthRole } from "@/types/auth.types";

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

