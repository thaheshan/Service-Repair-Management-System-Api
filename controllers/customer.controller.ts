import {
  createCustomer,
  searchCustomers,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "@/services/customer/customer.service";
import {
  createCustomerSchema,
  updateCustomerSchema,
  searchCustomerSchema,
} from "@/validators/customer/customer.validator";
import type { AuthRequest } from "@/types/auth.types";
import { logger } from "@/config/logger.config";
import { Request, Response } from "express";

// POST /api/v1/customers
export const addCustomer = async (req: Request, res: Response) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[addCustomer] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({ error: "Customer creation failed", errors: parsed.error.issues });
  }

  try {
    const auth = (req as AuthRequest).user!;
    const customer = await createCustomer(parsed.data, auth.tenantId, auth.shopId!);
    return res.status(201).json({ message: "Customer created", customerId: customer.id });
  } catch (error: any) {
    logger.error(`[addCustomer] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ error: "Customer creation failed" });
  }
};

// GET /api/v1/customers/search?q=
export const searchCustomer = async (req: Request, res: Response) => {
  const parsed = searchCustomerSchema.safeParse(req.query);
  if (!parsed.success) {
    logger.warn(`[searchCustomer] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({ error: "Unable to perform customer search", errors: parsed.error.issues });
  }

  try {
    const auth = (req as AuthRequest).user!;
    const customers = await searchCustomers(parsed.data.q, auth.tenantId, auth.shopId!);
    return res.status(200).json({ customers });
  } catch (error: any) {
    logger.error(`[searchCustomer] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ error: "Unable to perform customer search" });
  }
};

// GET /api/v1/customers
export const listCustomers = async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthRequest).user!;
    const customers = await getCustomers(auth.tenantId, auth.shopId!);
    return res.status(200).json({ customers });
  } catch (error: any) {
    logger.error(`[listCustomers] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ error: "Unable to fetch customers" });
  }
};

// GET /api/v1/customers/:customerId
export const getCustomer = async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthRequest).user!;
    const customerId = req.params.customerId as string;
    const customer = await getCustomerById(customerId, auth.tenantId, auth.shopId!);
    return res.status(200).json(customer);
  } catch (error: any) {
    logger.error(`[getCustomer] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ error: "Customer not found" });
  }
};

// PUT /api/v1/customers/:customerId
export const editCustomer = async (req: Request, res: Response) => {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn(`[editCustomer] -> Validation failed: ${parsed.error.message}`);
    return res.status(400).json({ error: "Update failed", errors: parsed.error.issues });
  }

  try {
    const auth = (req as AuthRequest).user!;
    const customerId = req.params.customerId as string;
    await updateCustomer(customerId, parsed.data, auth.tenantId, auth.shopId!);
    return res.status(200).json({ message: "Customer updated successfully" });
  } catch (error: any) {
    logger.error(`[editCustomer] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ error: "Update failed" });
  }
};

// DELETE /api/v1/customers/:customerId
export const removeCustomer = async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthRequest).user!;
    const customerId = req.params.customerId as string;
    await deleteCustomer(customerId, auth.tenantId, auth.shopId!);
    return res.status(200).json({ message: "Customer deleted" });
  } catch (error: any) {
    logger.error(`[removeCustomer] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ 
      error: error.message || "Delete failed" 
    });
  }
};