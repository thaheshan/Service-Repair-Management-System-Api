import { Router } from "express";
import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import authRouter from "@/routes/auth.routes";
import usersRouter from "@/routes/users.routes";
import shopRouter from "@/routes/shops.routes";
import repairsRouter from "@/routes/repairs.routes";
import paymentRouter from "@/routes/payment.routes";
import subscriptionRouter from "@/routes/subscription.routes";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();

router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "UP", timestamp: new Date().toISOString() });
});

router.use("/auth", authRouter);

// Versioned APIs (Public or partially public)
router.use("/v1/payment", paymentRouter);
router.use("/v1/subscription", subscriptionRouter);

router.use(authenticate);

router.use("/users", usersRouter);
router.use("/shops", shopRouter);
router.use("/repairs", repairsRouter);

export default router;