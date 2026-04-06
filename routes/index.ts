import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import repairsRouter from "@/routes/repairs.routes";
import shopRouter from "@/routes/shops.routes";
import usersRouter from "@/routes/users.routes";
import dashboardRouter from "@/routes/dashboard.routes";
import authRouter from "@/routes/auth.routes";
import { verifyEmail } from "@/controllers/shop.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "UP", timestamp: new Date().toISOString() });
});

router.use("/v1/auth", authRouter);
router.get("/v1/users/verify-email", verifyEmail);
router.use(authenticate);

router.use("/v1/users", usersRouter);
router.use("/v1/shops", shopRouter);
router.use("/v1/repairs", repairsRouter);
router.use("/v1/dashboard", dashboardRouter);

export default router;