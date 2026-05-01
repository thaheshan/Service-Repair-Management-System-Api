import { Router } from "express";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { todayRepairs, getPendingRepairs } from "@/controllers/dashboard.controller";

const router = Router();

router.get("/today-repairs", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), todayRepairs);
router.get("/pending-repairs", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getPendingRepairs);

export default router;