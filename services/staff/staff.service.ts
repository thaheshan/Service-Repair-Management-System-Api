import { prisma } from "@/db/prisma";
import { STAFF_ASSIGNABLE_ROLES } from "@/types/staff.types";
import type { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import type { CreateStaffInput, UpdateStaffInput } from "@/validators/staff/staff.validator";

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

async function resolveActiveStaffUserId(
  tenantId: string,
  shopId: string,
  staffIdParam: string,
): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      shopId,
      isActive: true,
      role: { in: [...STAFF_ASSIGNABLE_ROLES] },
      OR: [{ staffDisplayId: staffIdParam }, { id: staffIdParam }],
    },
    select: { id: true },
  });
  return user?.id ?? null;
}

export const listStaffMembers = async (
  tenantId: string,
  shopId: string | null,
): Promise<StaffListRow[]> => {
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      isActive: true,
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

export const updateStaffMember = async (
  tenantId: string,
  shopId: string,
  staffIdParam: string,
  actorUserId: string,
  data: UpdateStaffInput,
): Promise<void> => {
  const targetId = await resolveActiveStaffUserId(tenantId, shopId, staffIdParam);
  if (!targetId) {
    throw { status: 404, code: "NOT_FOUND" };
  }
  if (targetId === actorUserId) {
    throw { status: 400, code: "SELF_ACTION" };
  }

  const passwordHash =
    data.password !== undefined ? await bcrypt.hash(data.password, BCRYPT_ROUNDS) : undefined;

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone === null ? null : data.phone.trim() || null;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (passwordHash !== undefined) updateData.password = passwordHash;

  try {
    await prisma.user.update({
      where: { id: targetId },
      data: updateData as any,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[])
        : typeof error.meta?.target === "string"
          ? [error.meta.target]
          : [];
      throw { status: 409, code: "DUPLICATE", target };
    }
    if (error.code === "P2025") {
      throw { status: 404, code: "NOT_FOUND" };
    }
    throw error;
  }
};

export const deactivateStaffMember = async (
  tenantId: string,
  shopId: string,
  staffIdParam: string,
  actorUserId: string,
): Promise<void> => {
  const targetId = await resolveActiveStaffUserId(tenantId, shopId, staffIdParam);
  if (!targetId) {
    throw { status: 404, code: "NOT_FOUND" };
  }
  if (targetId === actorUserId) {
    throw { status: 400, code: "SELF_ACTION" };
  }

  try {
    await prisma.user.update({
      where: { id: targetId },
      data: { isActive: false },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, code: "NOT_FOUND" };
    }
    throw error;
  }
};
