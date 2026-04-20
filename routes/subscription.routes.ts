import { Router } from "express";
import * as subscriptionController from "@/controllers/subscription.controller";

const router = Router();

// Internal/Cron endpoint
router.get("/check-expiry", subscriptionController.checkSubscriptionExpiry);

export default router;
