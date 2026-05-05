import { getRepairsReport } from "@/controllers/repairReport.controller";
import { getCustomersReport } from "@/controllers/customerReport.controller";
import { getTechnicianReportHandler } from "@/controllers/technicianReport.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/repairs", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getRepairsReport);
router.get("/technician", authorizeRoles("ADMIN", "MANAGER"), getTechnicianReportHandler);
router.get("/customers", authorizeRoles("ADMIN", "MANAGER"), getCustomersReport);

export default router;
