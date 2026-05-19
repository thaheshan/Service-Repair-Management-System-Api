import Stripe from 'stripe';
import { logger } from "@/config/logger.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-03-25.dahlia', // Pinned to installed stripe package version
});

export const createPaymentIntent = async (amount: number, currency: string = 'lkr', metadata: any = {}) => {
  try {
    logger.info(`[Stripe] Creating payment intent for ${amount} ${currency}`);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe uses cents/paisa
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    };
  } catch (error: any) {
    logger.error(`[Stripe] Error creating payment intent: ${error.message}`);
    throw error;
  }
};

export const verifyPaymentIntent = async (paymentIntentId: string, requestId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded' && paymentIntent.metadata.requestId === requestId;
  } catch (error: any) {
    logger.error(`[Stripe] Error verifying payment: ${error.message}`);
    return false;
  }
};
