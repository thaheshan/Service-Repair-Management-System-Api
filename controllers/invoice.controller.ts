import type { Request, Response } from "express";
import * as invoiceService from "@/services/invoice/invoice.service";
import type { AuthRequest } from "@/types/auth.types";

/**
 * Retrieves all invoices for the authenticated tenant with customer details.
 */
export const getAllInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await invoiceService.getAllInvoices(req.user!.tenantId);

    return res.status(200).json({
      invoices,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Unable to fetch invoices" });
  }
};

/**
 * Generates an invoice for a completed repair job.
 */
export const generateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await invoiceService.generateInvoice(req.body.repairId, req.user!.tenantId);

    return res.status(201).json({
      message: "Invoice generated successfully",
      invoiceId: invoice.invoiceNumber,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
    });
  } catch (error: any) {
    if (error?.status === 404) {
      return res.status(404).json({ error: "Repair job not found" });
    }

    if (error?.status === 400) {
      return res.status(400).json({ error: "Repair job is not completed yet" });
    }

    if (error?.status === 409) {
      return res.status(409).json({ error: "Invoice already exists for this repair job" });
    }

    return res.status(500).json({ error: "Invoice generation failed" });
  }
};