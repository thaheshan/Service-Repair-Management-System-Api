import {
  createDevice,
  deleteDevice,
  getDeviceById,
  getDevices,
  updateDevice,
} from "@/controllers/device.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get("/", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getDevices);
router.get("/:id", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getDeviceById);
router.post("/", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), createDevice);
router.patch("/:id", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), updateDevice);
router.delete("/:id", authorizeRoles("ADMIN", "MANAGER"), deleteDevice);

export default router;
