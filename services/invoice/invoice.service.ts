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
      where: {
        repair: {
          tenantId,
        },
      },
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
  const repair = await prisma.repair.findFirst({
    where: { id: repairId, tenantId },
  });

  if (!repair) {
    throw { status: 404, message: "Repair job not found" };
  }

  if (repair.status !== "DELIVERED") {
    throw { status: 400, message: "Repair job is not completed yet" };
  }

  const existingInvoice = await prisma.invoice.findUnique({
    where: { repairId },
  });

  if (existingInvoice) {
    throw { status: 409, message: "An invoice already exists for this repair job" };
  }

  const shopSettings = await prisma.shopSettings.findUnique({
    where: { tenantId: repair.tenantId },
  });

  const subtotal =
    toNumber(repair.parts) +
    toNumber(repair.laborCost) +
    toNumber(repair.serviceCharges);

  const taxRate = toNumber(shopSettings?.taxRate);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  try {
    return await prisma.invoice.create({
      data: {
        invoiceNumber: `INV${Date.now()}`,
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
};