import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import repairsRouter from "@/routes/repairs.routes";
import shopRouter from "@/routes/shops.routes";
import usersRouter from "@/routes/users.routes";
import authRouter from "@/routes/auth.routes";
import staffRouter from "@/routes/staff.routes";
import { authenticate } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "UP", timestamp: new Date().toISOString() });
});

router.use("/auth", authRouter);

router.use(authenticate);

router.use("/users", usersRouter);
router.use("/shops", shopRouter);
router.use("/repairs", repairsRouter);
router.use("/staff", staffRouter);

export default router;