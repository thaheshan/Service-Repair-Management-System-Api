import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import repairsRouter from "@/routes/repairs.routes";
import shopsRouter from "@/routes/shops.routes";
import usersRouter from "@/routes/users.routes";
import { Router } from "express";

const router = Router();

router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "UP", timestamp: new Date().toISOString() });
});

router.use("/users", usersRouter);
router.use("/shops", shopsRouter);
router.use("/repairs", repairsRouter);

export default router;