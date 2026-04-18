import { todayRepairs } from "@/controllers/dashboard.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/today-repairs", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), todayRepairs);

export default router;