import { Request, Response } from "express";
import { logger } from "@/config/logger.config";
import * as paymentService from "@/services/payment/payment.service";
import { SubscriptionPlan, PaymentMethod } from "@prisma/client";
import { env } from "@/config/env";
import Stripe from "stripe";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  let event: any;

  try {
    const rawBody = (req as any).rawBody;

    if (!sig || !rawBody) {
      logger.error("[handleStripeWebhook] -> Missing stripe-signature or rawBody");
      return res.status(400).json({ success: false, message: "Webhook signature verification failed" });
    }

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig as string,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    logger.error(`[handleStripeWebhook] -> Signature error: ${error.message}`);
    return res.status(400).json({ success: false, message: `Webhook Error: ${error.message}` });
  }

  logger.info(`[handleStripeWebhook] -> Verified event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as any;
        
        // Null guards for metadata
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan as SubscriptionPlan;

        if (!tenantId || !plan) {
          logger.error("[handleStripeWebhook] -> Missing tenantId or plan in session metadata");
          return res.status(400).json({ success: false, message: "Invalid session metadata" });
        }
        
        logger.info(`[handleStripeWebhook] -> Processing checkout for tenant: ${tenantId}`);
        
        await paymentService.activateShopSubscription(
          tenantId,
          plan,
          (session.amount_total || 0) / 100,
          session.id,
          PaymentMethod.CARD
        );
        break;

      default:
        logger.info(`[handleStripeWebhook] -> Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ success: true, received: true });
  } catch (error: any) {
    logger.error(`[handleStripeWebhook] -> Handler failed: ${error.message}`);
    return res.status(500).json({ 
      success: false,
      message: "Webhook handler failed", 
      details: error.message 
    });
  }
};

export const verifyBankTransfer = async (req: Request, res: Response) => {
  const { tenantId, plan, amount, reference, admin_verified } = req.body;

  if (!tenantId || !plan || !amount || admin_verified !== true) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required verification data (tenantId, plan, amount, admin_verified)" 
    });
  }

  try {
    logger.info(`[verifyBankTransfer] -> Manually activating subscription for tenant: ${tenantId}`);

    await paymentService.activateShopSubscription(
      tenantId,
      plan as SubscriptionPlan,
      amount,
      reference || `BANK_REF_${Date.now()}`,
      PaymentMethod.BANK_TRANSFER
    );

    return res.status(200).json({ 
      success: true, 
      message: "Payment confirmed and subscription activated" 
    });
  } catch (error: any) {
    logger.error(`[verifyBankTransfer] -> Error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: "Update failed",
      details: error.message
    });
  }
};
