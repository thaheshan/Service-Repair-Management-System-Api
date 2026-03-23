import { todayRepairs } from "@/controllers/dashboard.controller";
import { Router } from "express";

const router = Router();

// TODO: Add auth middleware here once auth is done
// router.use(authMiddleware);

router.get("/today-repairs", todayRepairs);

export default router;