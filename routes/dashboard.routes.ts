import { Router } from "express";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { getPendingRepairs } from "@/controllers/dashboard.controller";

const router = Router();

router.get("/pending-repairs", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getPendingRepairs);

export default router;

