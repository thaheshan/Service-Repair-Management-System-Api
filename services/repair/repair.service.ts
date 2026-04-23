import { prisma } from "@/db/prisma";

export const getTenantRepairs = async (tenantId: string) => {
  return prisma.repair.findMany({
    where: { tenantId },
    include: { customer: true, device: true, technician: { select: { id: true, email: true, role: true } } },
  });
};

export const getTenantRepairById = async (id: string, tenantId: string) => {
  const repair = await prisma.repair.findFirst({
    where: { id, tenantId },
    include: { customer: true, device: true, technician: { select: { id: true, email: true, role: true } }, photos: true },
  });

  if (!repair) {
    throw { status: 404, message: "Repair not found" };
  }

  return repair;
};

export const createTenantRepair = async (
  tenantId: string,
  data: {
    shopId: string;
    customerId: string;
    deviceId: string;
    issue?: string;
    estimatedCost?: number;
    technicianId?: string;
  }
) => {
  const reference = `REP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  
  return prisma.repair.create({
    data: { 
      tenantId, 
      reference,
      ...data 
    },
  });
};

export const updateTenantRepair = async (
  id: string,
  tenantId: string,
  data: {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "READY_TO_TAKE" | "DELIVERED";
    diagnosis?: string;
    estimatedCost?: number;
    finalCost?: number;
    technicianId?: string;
  }
) => {
  try {
    return await prisma.repair.update({
      where: { id, tenantId },
      data,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, message: "Repair not found" };
    }
    throw error;
  }
};

export const deleteTenantRepair = async (id: string, tenantId: string): Promise<void> => {
  try {
    await prisma.repair.delete({
      where: { id, tenantId },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, message: "Repair not found" };
    }
    throw error;
  }
};
