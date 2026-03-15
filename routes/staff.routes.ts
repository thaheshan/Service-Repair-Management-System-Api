import {
  getStaffDashboardContext,
  registerStaff,
  validateShopId,
} from "@/controllers/staff.controller";
import { requireRoles, verifyAccessToken } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/register", registerStaff);
router.post("/validate-shop-id", validateShopId);
router.get(
  "/me",
  verifyAccessToken,
  requireRoles("TECHNICIAN", "MANAGER"),
  getStaffDashboardContext,
);

export default router;
