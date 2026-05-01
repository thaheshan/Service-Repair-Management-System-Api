import { prisma } from "@/db/prisma";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;

export const getTenantUsers = async (tenantId: string) => {
  return prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, role: true, isActive: true, tenantId: true, shopId: true, createdAt: true, updatedAt: true },
  });
};

export const getTenantUserById = async (id: string, tenantId: string) => {
  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true, email: true, role: true, isActive: true, tenantId: true, shopId: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return user;
};

export const createTenantUser = async (
  tenantId: string,
  data: {
    email: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";
    shopId?: string | null;
    fullName?: string;
  }
) => {
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  try {
    return await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName ?? data.email,
        password: passwordHash,
        role: data.role,
        tenantId,
        shopId: data.shopId,
      },
      select: { id: true, email: true, role: true, isActive: true, tenantId: true, shopId: true, createdAt: true },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw { status: 409, message: "Email already exists" };
    }
    throw error;
  }
};

export const updateTenantUser = async (
  id: string,
  tenantId: string,
  data: { email?: string; role?: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER"; isActive?: boolean; shopId?: string | null }
) => {
  try {
    return await prisma.user.update({
      where: { id, tenantId },
      data,
      select: { id: true, email: true, role: true, isActive: true, shopId: true, updatedAt: true },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, message: "User not found" };
    }
    throw error;
  }
};

export const deleteTenantUser = async (id: string, tenantId: string): Promise<void> => {
  try {
    await prisma.user.delete({
      where: { id, tenantId },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, message: "User not found" };
    }
    throw error;
  }
};
