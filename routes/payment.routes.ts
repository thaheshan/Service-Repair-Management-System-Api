import { Router } from "express";
import * as paymentController from "@/controllers/payment.controller";
import { authenticate, authorizeRoles } from "@/middlewares/auth.middleware";

const router = Router();

// Public webhook (No authentication, Stripe will call this)
router.post("/webhook", paymentController.handleStripeWebhook);

// PayHere notification (No authentication)
router.post("/payhere-notify", paymentController.handlePayHereNotify);

// Admin only bank verification
router.post(
  "/bank-verify", 
  authenticate,
  authorizeRoles("ADMIN"), 
  paymentController.verifyBankTransfer
);

export default router;
