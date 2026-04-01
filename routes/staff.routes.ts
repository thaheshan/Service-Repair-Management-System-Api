import { addStaff, getStaffList } from "@/controllers/staff.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/", authorizeRoles("ADMIN", "MANAGER"), getStaffList);
router.post("/", authorizeRoles("ADMIN"), addStaff);

export default router;

