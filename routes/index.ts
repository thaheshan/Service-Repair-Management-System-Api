import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import { requireRoles, verifyAccessToken } from "@/middlewares/auth.middleware";
import repairsRouter from "@/routes/repairs.routes";
import shopsRouter from "@/routes/shops.routes";
import staffRouter from "@/routes/staff.routes";
import usersRouter from "@/routes/users.routes";
import { Router } from "express";

const router = Router();

router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "UP", timestamp: new Date().toISOString() });
});

router.use("/staff", staffRouter);
router.use("/users", verifyAccessToken, requireRoles("ADMIN", "MANAGER"), usersRouter);
router.use("/shops", verifyAccessToken, requireRoles("ADMIN", "MANAGER"), shopsRouter);
router.use("/repairs", verifyAccessToken, requireRoles("ADMIN", "MANAGER", "TECHNICIAN"), repairsRouter);

export default router;