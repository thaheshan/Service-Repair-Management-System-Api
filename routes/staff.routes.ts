import { addStaff, deleteStaff, getStaffList, updateStaff } from "@/controllers/staff.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/", authorizeRoles("ADMIN", "MANAGER"), getStaffList);
router.post("/", authorizeRoles("ADMIN"), addStaff);
router.put("/:staffId", authorizeRoles("ADMIN"), updateStaff);
router.delete("/:staffId", authorizeRoles("ADMIN"), deleteStaff);

export default router;

