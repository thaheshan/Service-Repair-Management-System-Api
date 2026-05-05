import { getRepairsReport } from "@/controllers/repairReport.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/repairs", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getRepairsReport);

export default router;
