import { prisma } from "@/db/prisma";
import type { AuthRole } from "@/types/auth.types";

export async function countPendingRepairs(params: {
  tenantId: string;
  role: AuthRole;
  userId: string;
}) {
  const { tenantId, role, userId } = params;

  return prisma.repair.count({
    where: {
      tenantId,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      ...(role === "TECHNICIAN" ? { technicianId: userId } : {}),
    },
  });
}

