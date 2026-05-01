import { Router } from "express";
import * as subscriptionController from "@/controllers/subscription.controller";

import { authenticate, authorizeRoles } from "@/middlewares/auth.middleware";

const router = Router();

// Internal/Cron endpoint - Protect with Admin role
router.get(
  "/check-expiry", 
  authenticate,
  authorizeRoles("ADMIN"),
  subscriptionController.checkSubscriptionExpiry
);

export default router;
