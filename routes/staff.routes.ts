import {
  getStaffDashboardContext,
  registerStaff,
  validateShopId,
} from "@/controllers/staff.controller";
import { authenticate, authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/register", registerStaff);
router.post("/validate-shop-id", validateShopId);
router.get(
  "/me",
  authenticate,
  authorizeRoles("TECHNICIAN", "MANAGER"),
  getStaffDashboardContext,
);

export default router;
