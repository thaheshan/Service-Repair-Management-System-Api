import { prisma } from "@/db/prisma";
import { CreateCustomerRequest, UpdateCustomerRequest } from "@/types/dto/customer.dto";
import { logger } from "@/config/logger.config";

export const createCustomer = async (
  data: CreateCustomerRequest,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[createCustomer] -> Creating customer: ${data.name}`);

  const customer = await prisma.customer.create({
  data: {
    tenantId,
    shopId,
    name: data.name,
    phone: data.phone ?? null,
    email: data.email ?? null,
    address: data.address ?? null,
  },
});

  logger.info(`[createCustomer] -> Customer created: ${customer.id}`);
  return customer;
};

export const searchCustomers = async (
  q: string,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[searchCustomers] -> Searching customers with term: ${q}`);

  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      shopId,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  });

  logger.info(`[searchCustomers] -> Found ${customers.length} customers`);
  return customers;
};

export const getCustomers = async (tenantId: string, shopId: string) => {
  logger.info(`[getCustomers] -> Fetching all customers for shop: ${shopId}`);

  const customers = await prisma.customer.findMany({
    where: { tenantId, shopId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
    orderBy: { createdAt: "desc" },
  });

  logger.info(`[getCustomers] -> Found ${customers.length} customers`);
  return customers;
};

export const getCustomerById = async (
  customerId: string,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[getCustomerById] -> Fetching customer: ${customerId}`);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, shopId },
  });

  if (!customer) {
    logger.warn(`[getCustomerById] -> Customer not found: ${customerId}`);
    throw { status: 404, message: "Customer not found" };
  }

  logger.info(`[getCustomerById] -> Customer found: ${customerId}`);
  return customer;
};

export const updateCustomer = async (
  customerId: string,
  data: UpdateCustomerRequest,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[updateCustomer] -> Updating customer: ${customerId}`);

  const existing = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, shopId },
  });

  if (!existing) {
    logger.warn(`[updateCustomer] -> Customer not found: ${customerId}`);
    throw { status: 404, message: "Customer not found" };
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.phone && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
    },
  });

  logger.info(`[updateCustomer] -> Customer updated: ${customerId}`);
  return customer;
};

export const deleteCustomer = async (
  customerId: string,
  tenantId: string,
  shopId: string
) => {
  logger.info(`[deleteCustomer] -> Deleting customer: ${customerId}`);

  const existing = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, shopId },
    include: {
      _count: {
        select: { repairs: true, devices: true },
      },
    },
  });

  if (!existing) {
    logger.warn(`[deleteCustomer] -> Customer not found: ${customerId}`);
    throw { status: 404, message: "Customer not found" };
  }

  if (existing._count.repairs > 0 || existing._count.devices > 0) {
    logger.warn(`[deleteCustomer] -> Cannot delete customer with ${existing._count.repairs} repairs and ${existing._count.devices} devices`);
    throw {
      status: 400,
      message: `Cannot delete customer with associated repairs (${existing._count.repairs}) or devices (${existing._count.devices})`,
    };
  }

  await prisma.customer.delete({ where: { id: customerId } });

  logger.info(`[deleteCustomer] -> Customer deleted: ${customerId}`);
};