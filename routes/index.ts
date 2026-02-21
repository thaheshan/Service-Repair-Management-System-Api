import { apiRateLimiter } from "@/middlewares/rateLimit.middleware";
import { Router } from "express";

const router = Router();

// ✅ APPLY GLOBAL MIDDLEWARE FIRST
router.use(apiRateLimiter);

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

export default router;