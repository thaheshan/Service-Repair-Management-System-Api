import {
  addInventoryItem,
  listInventoryItems,
  getInventoryItem,
  editInventoryItem,
  removeInventoryItem,
  lowStock,
  usage,
} from "@/controllers/inventory.controller";
import { authorizeRoles } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

// Special routes first (before /:itemId)
router.get("/low-stock", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), lowStock);
router.get("/usage", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), usage);

// CRUD routes
router.get("/", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), listInventoryItems);
router.post("/", authorizeRoles("ADMIN", "MANAGER"), addInventoryItem);
router.get("/:itemId", authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"), getInventoryItem);
router.put("/:itemId", authorizeRoles("ADMIN", "MANAGER"), editInventoryItem);
router.delete("/:itemId", authorizeRoles("ADMIN"), removeInventoryItem);

export default router;