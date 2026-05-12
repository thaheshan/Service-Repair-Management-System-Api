import { prisma } from "@/db/prisma";

function toNumber(value: unknown): number {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

/**
 * Retrieves all invoices for a tenant with customer details.
 */
export const getAllInvoices = async (tenantId: string) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invoices.map((invoice) => ({
      invoiceId: invoice.invoiceNumber,
      customer: invoice.customer.name,
      amount: Number(invoice.total),
      status: invoice.status,
    }));
  } catch (error: any) {
    throw { status: 500, message: "Failed to fetch invoices" };
  }
}

/**
 * Generates and persists an invoice for a repair job.
 */
export const generateInvoice = async (repairId: string, tenantId: string) => {
  return await prisma.$transaction(async (tx) => {
    const repair = await tx.repair.findFirst({
      where: { id: repairId, tenantId },
    });

    if (!repair) {
      throw { status: 404, message: "Repair job not found" };
    }

    if (repair.status !== "DELIVERED") {
      throw { status: 400, message: "Repair job is not completed yet" };
    }

    const existingInvoice = await tx.invoice.findUnique({
      where: { repairId },
    });

    if (existingInvoice) {
      throw { status: 409, message: "An invoice already exists for this repair job" };
    }

    const shopSettings = await tx.shopSettings.findUnique({
      where: { tenantId: repair.tenantId },
    });

    const subtotal =
      toNumber(repair.parts) +
      toNumber(repair.laborCost) +
      toNumber(repair.serviceCharges);

    const taxRate = toNumber(shopSettings?.taxRate);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const shop = await tx.shop.update({
      where: { id: repair.shopId },
      data: {
        invoiceSequence: {
          increment: 1,
        },
      },
      select: {
        shopCode: true,
        invoiceSequence: true,
      },
    });

    const invoiceNumber = `${shop.shopCode}-INV-${String(shop.invoiceSequence).padStart(4, "0")}`;

    try {
      return await tx.invoice.create({
        data: {
          invoiceNumber,
          tenantId: repair.tenantId,
          shopId: repair.shopId,
          repairId: repair.id,
          customerId: repair.customerId,
          subtotal,
          taxAmount,
          total,
          status: "PENDING",
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw { status: 409, message: "An invoice already exists for this repair job" };
      }

      throw error;
    }
  });
};