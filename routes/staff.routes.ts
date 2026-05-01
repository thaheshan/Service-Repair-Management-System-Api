import {
  addStaff,
  deleteStaff,
  getStaffDashboardContext,
  getStaffList,
  registerStaff,
  updateStaff,
  validateShopId,
} from "@/controllers/staff.controller";
import { authenticate, authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

// Public staff self-registration
router.post("/register", registerStaff);
router.post("/validate-shop-id", validateShopId);

// Protected staff context + management
router.get("/me", authenticate, authorizeRoles("TECHNICIAN", "MANAGER"), getStaffDashboardContext);
router.get("/", authenticate, authorizeRoles("ADMIN", "MANAGER"), getStaffList);
router.post("/", authenticate, authorizeRoles("ADMIN"), addStaff);
router.put("/:staffId", authenticate, authorizeRoles("ADMIN"), updateStaff);
router.delete("/:staffId", authenticate, authorizeRoles("ADMIN"), deleteStaff);

export default router;