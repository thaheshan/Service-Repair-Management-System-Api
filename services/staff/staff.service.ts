import { prisma } from "@/db/prisma";
import { STAFF_ASSIGNABLE_ROLES } from "@/types/staff.types";
import type { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import type { CreateStaffInput } from "@/validators/staff/staff.validator";

const BCRYPT_ROUNDS = 12;

function roleToLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ADMIN: "Admin",
    MANAGER: "Manager",
    TECHNICIAN: "Technician",
    CUSTOMER: "Customer",
  };
  return labels[role];
}

export type StaffListRow = {
  staffId: string;
  name: string;
  role: string;
  isActive: boolean;
};

export const listStaffMembers = async (
  tenantId: string,
  shopId: string | null,
): Promise<StaffListRow[]> => {
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: [...STAFF_ASSIGNABLE_ROLES] },
      ...(shopId ? { shopId } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      staffDisplayId: true,
      role: true,
      isActive: true,
    },
    orderBy: [{ staffDisplayId: "asc" }, { createdAt: "asc" }],
  });

  return users.map((u) => ({
    staffId: u.staffDisplayId ?? u.id,
    name: (u.name && u.name.trim()) || u.email,
    role: roleToLabel(u.role),
    isActive: u.isActive,
  }));
};

async function nextStaffDisplayId(tenantId: string): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ staffDisplayId: string | null }>>`
    SELECT "staffDisplayId"
    FROM "User"
    WHERE "tenantId" = ${tenantId}
      AND "staffDisplayId" IS NOT NULL
  `;

  let max = 0;
  for (const row of rows) {
    const id = row.staffDisplayId;
    if (!id) continue;
    const match = /^STAFF(\d+)$/i.exec(id);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }

  return `STAFF${max + 1}`;
}

export const createStaffMember = async (
  tenantId: string,
  shopId: string,
  data: CreateStaffInput,
): Promise<{ staffDisplayId: string }> => {
  const staffDisplayId = await nextStaffDisplayId(tenantId);
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  try {
    await (prisma.user as any).create({
      data: {
        tenantId,
        shopId,
        email: data.email,
        password: passwordHash,
        role: data.role,
        name: data.name,
        phone: data.phone?.trim() ? data.phone.trim() : null,
        staffDisplayId,
      },
    } as any);
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[])
        : typeof error.meta?.target === "string"
          ? [error.meta.target]
          : [];
      throw { status: 409, code: "DUPLICATE", target };
    }
    throw error;
  }

  return { staffDisplayId };
};
