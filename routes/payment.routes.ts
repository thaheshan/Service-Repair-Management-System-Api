import { Router } from "express";
import * as paymentController from "@/controllers/payment.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";

const router = Router();

// Public webhook (No authentication, Stripe will call this)
router.post("/webhook", paymentController.handleStripeWebhook);

// Admin only bank verification
router.post(
  "/bank-verify", 
  authorizeRoles("ADMIN"), 
  paymentController.verifyBankTransfer
);

export default router;
