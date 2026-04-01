import { prisma } from "@/db/prisma";
import bcrypt from "bcrypt";
import type { CreateStaffInput } from "@/validators/staff/staff.validator";

const BCRYPT_ROUNDS = 12;

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
