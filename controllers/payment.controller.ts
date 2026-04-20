import { Request, Response } from "express";
import { logger } from "@/config/logger.config";
import * as paymentService from "@/services/payment/payment.service";
import { SubscriptionPlan, PaymentMethod, PaymentType } from "@prisma/client";

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const event = req.body;

  logger.info(`[handleStripeWebhook] -> Received webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const tenantId = session.metadata.tenantId;
        const plan = session.metadata.plan as SubscriptionPlan;
        
        logger.info(`[handleStripeWebhook] -> Processing checkout for tenant: ${tenantId}`);
        
        await paymentService.activateShopSubscription(
          tenantId,
          plan,
          session.amount_total / 100,
          session.id,
          PaymentMethod.CARD
        );
        break;

      default:
        logger.info(`[handleStripeWebhook] -> Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error(`[handleStripeWebhook] -> Error: ${error.message}`);
    return res.status(500).json({ 
      error: "Webhook handler failed", 
      details: error.message 
    });
  }
};

export const verifyBankTransfer = async (req: Request, res: Response) => {
  const { payment_id, admin_verified } = req.body;

  if (!payment_id || admin_verified !== true) {
    return res.status(400).json({ success: false, message: "Invalid verification data" });
  }

  try {
    // In a real scenario, we'd lookup the pending payment/subscription request
    // and then activate it. For this step, we'll assume the payment_id links to a tenant
    // or we'll process based on the request.
    
    // logic to find the related shop and activate
    // For now, let's assume the payment_id is the tenantId for demonstration
    await paymentService.activateShopSubscription(
      payment_id,
      SubscriptionPlan.MEDIUM, // Default for manual verify
      100, // Placeholder
      `BANK_REF_${Date.now()}`,
      PaymentMethod.BANK_TRANSFER
    );

    return res.status(200).json({ success: true, message: "Payment confirmed and subscription activated" });
  } catch (error: any) {
    logger.error(`[verifyBankTransfer] -> Error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};
