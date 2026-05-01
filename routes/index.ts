import { Router } from "express";
import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import { authenticate, requireRoles, verifyAccessToken } from "@/middlewares/auth.middleware";
import authRouter from "@/routes/auth.routes";
import usersRouter from "@/routes/users.routes";
import shopsRouter from "@/routes/shops.routes";
import repairsRouter from "@/routes/repairs.routes";
import devicesRouter from "@/routes/devices.routes";
import staffRouter from "@/routes/staff.routes";
import inventoryRouter from "@/routes/inventory.routes";
import settingsRouter from "@/routes/settings.routes";
import paymentRouter from "@/routes/payment.routes";
import subscriptionRouter from "@/routes/subscription.routes";
import onboardingRouter from "@/routes/onboarding.routes";
import customersRouter from "@/routes/customers.routes";
import dashboardRouter from "@/routes/dashboard.routes";
import {
  verifyEmail,
  generateShopIds,
  registerShop,
  sendVerification as sendShopVerification,
} from "@/controllers/shop.controller";

const router = Router();

router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "UP", timestamp: new Date().toISOString() });
});

// Public routes
router.use("/v1/auth", authRouter);
router.get("/v1/users/verify-email", verifyEmail);
router.use("/v1/onboarding", onboardingRouter);

// Public Shop Onboarding Routes
router.post("/v1/shops/generate-ids", generateShopIds);
router.post("/v1/shops/register", registerShop);
router.post("/v1/shops/send-verification", sendShopVerification);

// Public Payment & Subscription webhooks (must be before authenticate)
router.use("/v1/payment", paymentRouter);
router.use("/v1/subscription", subscriptionRouter);

// Protected routes (authentication required)
router.use(authenticate);
router.use("/v1/users", usersRouter);
router.use("/v1/shops", shopsRouter);
router.use("/v1/repairs", repairsRouter);
router.use("/v1/devices", devicesRouter);
router.use("/v1/staff", staffRouter);
router.use("/v1/customers", customersRouter);
router.use("/v1/inventory", inventoryRouter);
router.use("/v1/settings", settingsRouter);
router.use("/v1/dashboard", dashboardRouter);

export default router;