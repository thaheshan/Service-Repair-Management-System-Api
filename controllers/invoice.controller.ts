import type { Request, Response } from "express";
import type { AuthRequest } from "@/types/auth.types";
import { logger } from "@/config/logger.config";
import {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceSummary,
} from "@/services/invoice/invoice.service";

// GET /api/v1/invoices
export const listInvoices = async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthRequest).user!;
    const invoices = await getInvoices(auth.tenantId);
    return res.status(200).json({ success: true, invoices });
  } catch (error: any) {
    logger.error(`[listInvoices] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ success: false, message: "Unable to fetch invoices" });
  }
};

// GET /api/v1/invoices/summary
export const invoiceSummary = async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthRequest).user!;
    const summary = await getInvoiceSummary(auth.tenantId);
    return res.status(200).json({ success: true, summary });
  } catch (error: any) {
    logger.error(`[invoiceSummary] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ success: false, message: "Unable to fetch summary" });
  }
};

// POST /api/v1/invoices
export const addInvoice = async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const { repairId, customerId, amount, paymentMethod, paymentType, notes, transactionReference } = req.body;

  if (!amount || !paymentMethod || !paymentType) {
    return res.status(400).json({ success: false, message: "amount, paymentMethod, and paymentType are required" });
  }

  try {
    const invoice = await createInvoice(auth.tenantId, {
      shopId: auth.shopId!,
      repairId,
      customerId,
      amount: Number(amount),
      paymentMethod,
      paymentType,
      notes,
      transactionReference,
    });
    return res.status(201).json({ success: true, invoice });
  } catch (error: any) {
    logger.error(`[addInvoice] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ success: false, message: "Unable to create invoice" });
  }
};

// PATCH /api/v1/invoices/:id/status
export const patchInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthRequest).user!;
    const id = req.params.id as string;
    const { status, amount } = req.body;
    
    if (!status && amount === undefined) {
      return res.status(400).json({ success: false, message: "status or amount is required" });
    }

    const updated = await updateInvoiceStatus(id, auth.tenantId, status, amount ? Number(amount) : undefined);
    return res.status(200).json({ success: true, invoice: updated });
  } catch (error: any) {
    logger.error(`[patchInvoiceStatus] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ success: false, message: "Unable to update invoice" });
  }
};

// DELETE /api/v1/invoices/:id
export const removeInvoice = async (req: Request, res: Response) => {
  try {
    const auth = (req as AuthRequest).user!;
    const id = req.params.id as string;
    await deleteInvoice(id, auth.tenantId);
    return res.status(200).json({ success: true, message: "Invoice deleted" });
  } catch (error: any) {
    logger.error(`[removeInvoice] -> ${error.message}`);
    return res.status(error.status ?? 500).json({ success: false, message: "Unable to delete invoice" });
  }
};
