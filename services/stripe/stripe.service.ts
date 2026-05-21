import { logger } from "@/config/logger.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia", // Pinned to installed stripe package version
});

export const createPaymentIntent = async (amount: number, currency: string = 'lkr', metadata: any = {}) => {
  logger.warn(`[Stripe] createPaymentIntent was called but Stripe is disabled.`);
  throw new Error("Stripe payments are disabled. Please use PayHere instead.");
};

export const verifyPaymentIntent = async (paymentIntentId: string, requestId: string) => {
  logger.warn(`[Stripe] verifyPaymentIntent was called but Stripe is disabled.`);
  return false;
};
