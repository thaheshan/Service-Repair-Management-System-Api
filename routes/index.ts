import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import { requireRoles, verifyAccessToken } from "@/middlewares/auth.middleware";
import repairsRouter from "@/routes/repairs.routes";
import shopsRouter from "@/routes/shops.routes";
import staffRouter from "@/routes/staff.routes";
import usersRouter from "@/routes/users.routes";
import authRouter from "@/routes/auth.routes";
import inventoryRouter from "@/routes/inventory.routes";
import onboardingRouter from "@/routes/onboarding.routes";
import customersRouter from "@/routes/customers.routes";
import dashboardRouter from "@/routes/dashboard.routes";
import { authenticate } from "@/middlewares/auth.middleware";
import { verifyEmail } from "@/controllers/shop.controller";
import { Router } from "express";
import {
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

// Protected routes (authentication required)
router.use(authenticate);
router.use("/v1/users", usersRouter);
router.use("/v1/shops", shopsRouter);       // fixed: was shopRouter in main
router.use("/v1/repairs", repairsRouter);
router.use("/v1/staff", staffRouter);       // from 86ew8mgtg
router.use("/v1/customers", customersRouter);
router.use("/v1/inventory", inventoryRouter);
router.use("/v1/dashboard", dashboardRouter);

export default router;