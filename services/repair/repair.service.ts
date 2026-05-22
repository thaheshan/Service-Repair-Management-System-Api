import { prisma } from "@/db/prisma";
import { Priority } from "@prisma/client";

export const getTenantRepairs = async (
  tenantId: string, 
  page?: number,
  limit?: number
) => {
  const hasPagination = page !== undefined && limit !== undefined;
  const skip = hasPagination ? (page - 1) * limit : undefined;
  const take = hasPagination ? limit : undefined;

  return prisma.repair.findMany({
    where: { tenantId },
    include: { customer: true, device: true, technician: { select: { id: true, email: true, fullName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    ...(hasPagination ? { skip, take } : {}),
  });
};

export const getTenantRepairById = async (id: string, tenantId: string) => {
  const repair = await prisma.repair.findFirst({
    where: { id, tenantId },
    include: { 
      customer: true, 
      device: true, 
      technician: { select: { id: true, email: true, fullName: true, role: true } }, 
      notes: { include: { user: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } },
      timeline: { orderBy: { createdAt: 'desc' } }
    },

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
    internalNotes?: string;
    diagnosis?: string;
    priority?: Priority;
    estimatedCompletionDate?: Date;
    estimatedCost?: number;
    finalCost?: number;
    technicianId?: string;
    status?: any;
  }
) => {
  const reference = `REP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  
  const repair = await prisma.repair.create({
    data: { 
      tenantId, 
      reference,
      ...data 
    },
  });

  await logTimelineEvent(repair.id, 'CREATED', `Repair created with status ${data.status || 'NOT_STARTED'}`);

  const isPaid = (data.status as any) === 'PAID' || data.status === 'DELIVERED';

  // Automatically create an invoice (Payment record) for the repair
  await prisma.payment.create({
    data: {
      tenantId,
      shopId: data.shopId,
      repairId: repair.id,
      customerId: data.customerId,
      amount: data.finalCost || data.estimatedCost || 0,
      paymentMethod: 'CASH', // Default
      paymentType: 'FULL',   // Default
      status: isPaid ? 'COMPLETED' : 'PENDING',
      ...(isPaid && { paymentDate: new Date() }),
      notes: `Automatically generated invoice for repair ${reference}`,
    }
  });

  return repair;
};

import { sendSms } from "@/services/notification/notification.service";

export const updateTenantRepair = async (
  id: string,
  tenantId: string,
  data: Record<string, any>
) => {
  try {
    const oldRepair = await prisma.repair.findFirst({ 
      where: { id }, 
      select: { status: true, customer: true, shop: { select: { shopName: true } }, reference: true } 
    });
    
    // Extract autoUpdateCustomer from data so it doesn't try to update it in the DB
    const { autoUpdateCustomer, ...updateData } = data;

    const repair = await prisma.repair.update({
      where: { id },
      data: updateData,
    });

    try {
      if (updateData.status && updateData.status !== oldRepair?.status) {
        await logTimelineEvent(id, 'STATUS_CHANGE', `Status changed from ${oldRepair?.status || 'UNKNOWN'} to ${updateData.status}`);
        
        // Send SMS to customer if requested
        if (autoUpdateCustomer && oldRepair?.customer?.phone) {
          const shopName = oldRepair.shop?.shopName || "Our Shop";
          const ref = oldRepair.reference;
          const statusText = updateData.status.replace(/_/g, " ");
          const message = `Hi ${oldRepair.customer.name},\nYour repair task (${ref}) status has been updated to: ${statusText}.\n\nThank you for choosing ${shopName}!`;
          
          await sendSms(oldRepair.customer.phone, message).catch((err) => {
            console.error("Failed to send SMS:", err);
          });
        }
      }
    } catch (logError) {
      console.error("Non-fatal: Failed to log timeline event or send SMS:", logError);
    }

    // Synchronize with Invoice (Payment record)
    const existingPayment = await prisma.payment.findFirst({
      where: { repairId: id, tenantId }
    });

    const isPaid = (data.status as any) === 'PAID' || data.status === 'DELIVERED';

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: data.finalCost || data.estimatedCost || existingPayment.amount,
          status: isPaid ? 'COMPLETED' : existingPayment.status,
          // Force update paymentDate to Today whenever it's marked as PAID to satisfy real-time tracking
          ...(isPaid && { paymentDate: new Date() })
        }
      });
    } else if (isPaid || data.estimatedCost || data.finalCost) {
      await prisma.payment.create({
        data: {
          tenantId,
          shopId: repair.shopId,
          repairId: id,
          customerId: repair.customerId,
          amount: data.finalCost || data.estimatedCost || 0,
          paymentMethod: 'CASH',
          paymentType: 'FULL',
          status: isPaid ? 'COMPLETED' : 'PENDING',
          ...(isPaid && { paymentDate: new Date() })
        }
      });
    }

    return repair;
  } catch (error: any) {
    if (error.code === "P2025") {
      throw { status: 404, message: "Repair not found" };
    }
    throw error;
  }
};

export const addRepairNote = async (repairId: string, userId: string, text: string) => {
  const note = await prisma.repairNote.create({
    data: { repairId, userId, text },
    include: { user: { select: { fullName: true } } }
  });

  await logTimelineEvent(repairId, 'NOTE_ADDED', 'New technician note added', userId);

  return note;
};

export const logTimelineEvent = async (repairId: string, type: string, description: string, userId?: string) => {
  return prisma.repairTimelineEvent.create({
    data: { repairId, type, description, userId }
  });
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
