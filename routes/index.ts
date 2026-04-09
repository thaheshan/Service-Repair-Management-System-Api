import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import repairsRouter from "@/routes/repairs.routes";
import shopRouter from "@/routes/shops.routes";
import usersRouter from "@/routes/users.routes";
import authRouter from "@/routes/auth.routes";
import customersRouter from "@/routes/customers.routes";
import { authenticate } from "@/middlewares/auth.middleware";
import { verifyEmail } from "@/controllers/shop.controller";
import { Router } from "express";

const router = Router();

router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "UP", timestamp: new Date().toISOString() });
});

// Public routes
router.use("/v1/auth", authRouter);
router.get("/v1/users/verify-email", verifyEmail);

// Protected routes
router.use(authenticate);

router.use("/v1/users", usersRouter);
router.use("/v1/shops", shopRouter);
router.use("/v1/repairs", repairsRouter);
router.use("/v1/customers", customersRouter);

export default router;